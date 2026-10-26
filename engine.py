"""
AI-Powered Daily Routine Redesign - core engine.

Pipeline:
 1. generate_dataset()  -> synthetic daily-routine logs (no private data needed)
 2. train_models()      -> ML models that predict Productivity and Wellbeing from a routine
 3. optimize()          -> energy-aware constraint scheduler that rebuilds a routine
 4. evaluate()          -> compares original vs redesigned routine using the trained models
"""
from __future__ import annotations

from dataclasses import dataclass, field
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

SLOT = 15                      # minutes per grid slot
DAY_SLOTS = 24 * 60 // SLOT    # 96 slots

# --------------------------------------------------------------------------- #
# Data model
# --------------------------------------------------------------------------- #
CATEGORIES = ["study", "work", "exercise", "meal", "leisure", "chores",
              "social", "commute", "sleep", "break"]


@dataclass
class Task:
    name: str
    category: str
    minutes: int
    priority: int = 3          # 1 (low) .. 5 (high)
    focus: int = 1             # 1 = light, 2 = medium, 3 = deep focus needed
    fixed_start: int | None = None   # minutes from midnight; None = flexible
    current_start: int | None = None  # when the person does it today (for 'before' view)

    @property
    def slots(self) -> int:
        return max(1, round(self.minutes / SLOT))


@dataclass
class Placed:
    task: Task
    start: int                 # slot index
    @property
    def end(self) -> int:
        return self.start + self.task.slots


def hhmm(minute: int) -> str:
    minute %= 24 * 60
    return f"{minute // 60:02d}:{minute % 60:02d}"


def parse_hhmm(s: str) -> int:
    h, m = s.split(":")
    return int(h) * 60 + int(m)


# --------------------------------------------------------------------------- #
# Energy model (circadian rhythm)
# --------------------------------------------------------------------------- #
def energy_curve(chronotype: str = "neutral") -> np.ndarray:
    """Energy 0..1 for each slot of the day. Two-peak circadian shape
    (late-morning peak, smaller evening peak, post-lunch dip)."""
    shift = {"morning": -1.5, "neutral": 0.0, "night": 2.5}[chronotype]
    t = np.arange(DAY_SLOTS) * SLOT / 60.0
    peak1 = np.exp(-((t - (10.5 + shift)) ** 2) / (2 * 2.0 ** 2))
    peak2 = 0.7 * np.exp(-((t - (17.5 + shift)) ** 2) / (2 * 2.2 ** 2))
    dip = -0.25 * np.exp(-((t - (14.0 + shift)) ** 2) / (2 * 0.9 ** 2))
    night = -0.5 * np.exp(-((t - (3.0 + shift)) ** 2) / (2 * 3.0 ** 2))
    e = 0.25 + 0.75 * (peak1 + peak2 + dip) + night
    return np.clip(e, 0.02, 1.0)


# --------------------------------------------------------------------------- #
# Synthetic dataset + ML models
# --------------------------------------------------------------------------- #
FEATURES = ["sleep_hours", "sleep_consistency", "study_hours", "peak_focus_ratio",
            "exercise_min", "screen_hours", "break_count", "meal_regularity",
            "leisure_hours", "task_switches", "free_buffer_min"]


def generate_dataset(n: int = 3000, seed: int = 42) -> pd.DataFrame:
    """Simulated daily logs. Relationships follow published sleep / productivity
    research (7-9 h sleep, exercise, breaks, working at peak energy help;
    excess screen time and heavy task switching hurt). Noise is added so the
    ML model has something real to learn."""
    rng = np.random.default_rng(seed)
    df = pd.DataFrame({
        "sleep_hours": np.clip(rng.normal(6.8, 1.3, n), 3.5, 10.5),
        "sleep_consistency": rng.uniform(0.2, 1.0, n),
        "study_hours": np.clip(rng.normal(4.5, 2.0, n), 0, 11),
        "peak_focus_ratio": rng.uniform(0.0, 1.0, n),
        "exercise_min": np.clip(rng.normal(25, 22, n), 0, 120),
        "screen_hours": np.clip(rng.normal(5.5, 2.5, n), 0.5, 13),
        "break_count": rng.integers(0, 10, n),
        "meal_regularity": rng.uniform(0.2, 1.0, n),
        "leisure_hours": np.clip(rng.normal(2.5, 1.4, n), 0, 7),
        "task_switches": rng.integers(2, 25, n),
        "free_buffer_min": np.clip(rng.normal(45, 35, n), 0, 180),
    })
    sleep_pen = -3.0 * (np.abs(df.sleep_hours - 8.0) ** 1.3) / 2
    study_eff = 9 * np.tanh(df.study_hours / 4.0) - 0.6 * np.maximum(df.study_hours - 8, 0) ** 2
    prod = (50 + sleep_pen + study_eff + 14 * df.peak_focus_ratio
            + 5 * df.sleep_consistency + 0.07 * np.minimum(df.exercise_min, 60)
            - 0.9 * np.maximum(df.screen_hours - 4, 0)
            + 1.6 * np.minimum(df.break_count, 6)
            - 0.45 * np.maximum(df.task_switches - 8, 0)
            + rng.normal(0, 3.5, n))
    well = (48 + sleep_pen * 1.4 + 0.22 * np.minimum(df.exercise_min, 60)
            + 7 * df.meal_regularity + 6 * df.sleep_consistency
            + 2.2 * np.minimum(df.leisure_hours, 3)
            - 1.2 * np.maximum(df.screen_hours - 5, 0)
            - 0.9 * np.maximum(df.study_hours - 7, 0)
            + 0.04 * np.minimum(df.free_buffer_min, 90)
            + rng.normal(0, 3.5, n))
    df["productivity"] = np.clip(prod, 0, 100)
    df["wellbeing"] = np.clip(well, 0, 100)
    return df


@dataclass
class Models:
    productivity: GradientBoostingRegressor
    wellbeing: GradientBoostingRegressor
    metrics: dict = field(default_factory=dict)
    importance: pd.DataFrame | None = None


def train_models(df: pd.DataFrame | None = None, seed: int = 42) -> Models:
    df = generate_dataset() if df is None else df
    X, out = df[FEATURES], {}
    fitted = {}
    for target in ("productivity", "wellbeing"):
        Xtr, Xte, ytr, yte = train_test_split(X, df[target], test_size=0.2, random_state=seed)
        m = GradientBoostingRegressor(n_estimators=250, max_depth=3, learning_rate=0.06,
                                      random_state=seed).fit(Xtr, ytr)
        pred = m.predict(Xte)
        out[target] = {"r2": r2_score(yte, pred), "mae": mean_absolute_error(yte, pred)}
        fitted[target] = m
    imp = pd.DataFrame({
        "feature": FEATURES,
        "productivity": fitted["productivity"].feature_importances_,
        "wellbeing": fitted["wellbeing"].feature_importances_,
    }).sort_values("productivity", ascending=False)
    return Models(fitted["productivity"], fitted["wellbeing"], out, imp)


# --------------------------------------------------------------------------- #
# Schedule -> features
# --------------------------------------------------------------------------- #
def extract_features(plan: list[Placed], energy: np.ndarray, sleep_hours: float,
                     sleep_consistency: float) -> dict:
    by_cat = lambda c: sum(p.task.minutes for p in plan if p.task.category == c)
    focus_tasks = [p for p in plan if p.task.category in ("study", "work")]
    total_focus = sum(p.task.minutes for p in focus_tasks) or 1
    in_peak = sum(p.task.minutes for p in focus_tasks
                  if energy[p.start:p.end].mean() >= 0.6)
    meals = sorted(p.start for p in plan if p.task.category == "meal")
    if len(meals) >= 2:
        gaps = np.diff(meals) * SLOT / 60
        regularity = float(np.clip(1 - np.std(gaps) / 6, 0.2, 1.0)) if len(gaps) > 1 else 0.7
        regularity *= min(1.0, len(meals) / 3)
    else:
        regularity = 0.25
    ordered = sorted(plan, key=lambda p: p.start)
    awake_slots = ordered[-1].end - ordered[0].start if ordered else 0
    busy = sum(p.task.slots for p in ordered)
    return {
        "sleep_hours": sleep_hours,
        "sleep_consistency": sleep_consistency,
        "study_hours": (by_cat("study") + by_cat("work")) / 60,
        "peak_focus_ratio": in_peak / total_focus,
        "exercise_min": by_cat("exercise"),
        "screen_hours": 2.0 + (by_cat("study") + by_cat("work")) / 60 * 0.6 + by_cat("leisure") / 60 * 0.5,
        "break_count": sum(1 for p in plan if p.task.category == "break"),
        "meal_regularity": float(np.clip(regularity, 0.2, 1.0)),
        "leisure_hours": by_cat("leisure") / 60,
        "task_switches": len([p for p in plan if p.task.category != "sleep"]),
        "free_buffer_min": max(0, (awake_slots - busy) * SLOT),
    }


def evaluate(plan: list[Placed], models: Models, energy: np.ndarray,
             sleep_hours: float, sleep_consistency: float) -> dict:
    f = extract_features(plan, energy, sleep_hours, sleep_consistency)
    x = pd.DataFrame([f])[FEATURES]
    return {
        "features": f,
        "productivity": float(np.clip(models.productivity.predict(x)[0], 0, 100)),
        "wellbeing": float(np.clip(models.wellbeing.predict(x)[0], 0, 100)),
    }


# --------------------------------------------------------------------------- #
# Original (user-given) schedule
# --------------------------------------------------------------------------- #
def build_original(tasks: list[Task]) -> list[Placed]:
    """The routine as the person lives it now. Tasks with a current_start (or
    fixed_start) go exactly there; any others are packed after the last task."""
    plan, taken = [], np.zeros(DAY_SLOTS, bool)
    for t in tasks:
        st = t.current_start if t.current_start is not None else t.fixed_start
        if st is not None:
            s = min(st // SLOT, DAY_SLOTS - t.slots)
            plan.append(Placed(t, s))
            taken[s:s + t.slots] = True
    cursor = max((p.end for p in plan), default=28)
    for t in tasks:
        if t.current_start is None and t.fixed_start is None:
            s = min(cursor, DAY_SLOTS - t.slots)
            plan.append(Placed(t, s))
            cursor = s + t.slots
    return sorted(plan, key=lambda p: p.start)


# --------------------------------------------------------------------------- #
# Optimizer
# --------------------------------------------------------------------------- #
def optimize(tasks: list[Task], chronotype: str = "neutral", wake: str = "06:30",
             bed: str = "22:45", add_breaks: bool = True, add_essentials: bool = True,
             buffer_slots: int = 0) -> tuple[list[Placed], list[str]]:
    """Energy-aware greedy scheduler with constraints:
       * fixed tasks never move (classes, commute...)
       * deep-focus, high-priority tasks get the highest-energy free windows
       * light tasks (chores, leisure) go to low-energy windows
       * a short break follows every ~90 min of focus work
       * essentials (meals, exercise) are inserted if missing
       * a buffer slot is left between tasks to absorb overruns
    Returns the plan and a list of human-readable change notes."""
    energy = energy_curve(chronotype)
    w, b = parse_hhmm(wake) // SLOT, parse_hhmm(bed) // SLOT
    notes: list[str] = []
    tasks = list(tasks)

    if add_essentials:
        have = {t.category for t in tasks}
        meals = [t for t in tasks if t.category == "meal"]
        if len(meals) < 3:
            for name, h in [("Breakfast", "07:30"), ("Lunch", "13:00"), ("Dinner", "19:30")]:
                if not any(m.name.lower() == name.lower() for m in meals):
                    tasks.append(Task(name, "meal", 30, 4, 1, None))
                    notes.append(f"Added {name} to keep meals regular.")
                    meals.append(tasks[-1])
                    if len([x for x in tasks if x.category == "meal"]) >= 3:
                        break
        if "exercise" not in have:
            tasks.append(Task("Exercise (walk/workout)", "exercise", 30, 4, 1, None))
            notes.append("Added 30 min exercise - strongest wellbeing lever in the model.")

    n_breaks = 0
    free = np.ones(DAY_SLOTS, bool)
    free[:w] = False
    free[b:] = False
    plan: list[Placed] = []

    # 1) fixed tasks
    for t in tasks:
        if t.fixed_start is not None:
            s = t.fixed_start // SLOT
            plan.append(Placed(t, s))
            free[max(0, s - 0):s + t.slots + buffer_slots] = False

    # 2) meals prefer anchor times (regularity), exercise prefers morning/late afternoon
    anchors = {"breakfast": "07:30", "lunch": "13:00", "dinner": "19:30"}
    flex = [t for t in tasks if t.fixed_start is None]
    meals = [t for t in flex if t.category == "meal"]
    for t in sorted(meals, key=lambda x: x.name):
        target = parse_hhmm(anchors.get(t.name.lower(), "13:00")) // SLOT
        best = _nearest_free(free, target, t.slots)
        if best is not None:
            plan.append(Placed(t, best))
            free[best:best + t.slots + buffer_slots] = False

    # 3) remaining tasks ordered by importance of getting a good slot
    rest = [t for t in flex if t.category != "meal"]
    rest.sort(key=lambda t: (-(t.focus * 2 + t.priority), -t.minutes))
    for t in rest:
        best, best_score = None, -1e9
        for s in range(w, b - t.slots + 1):
            if not free[s:s + t.slots].all():
                continue
            if t.category == "leisure" and s * SLOT < 17 * 60:
                continue          # leisure is a wind-down activity: after 17:00
            if t.category == "chores" and s * SLOT < 16 * 60:
                continue
            e = energy[s:s + t.slots].mean()
            if t.focus >= 2:
                score = e * (t.focus + 0.4 * t.priority)          # want high energy
            elif t.category == "exercise":
                score = 1.2 - abs(e - 0.65) - (0.4 if s * SLOT < 6 * 60 else 0)  # moderate energy
            else:
                score = (1 - e) * 0.8                              # light work in dips
            if score > best_score:
                best, best_score = s, score
        if best is None:
            notes.append(f"Could not fit '{t.name}' - reduce other tasks or extend the day.")
            continue
        plan.append(Placed(t, best))
        free[best:best + t.slots + buffer_slots] = False
        if add_breaks and t.category in ("study", "work") and t.minutes >= 60:
            e = best + t.slots
            if e < DAY_SLOTS and free[e]:
                plan.append(Placed(Task("Short break", "break", 15, 2, 1), e))
                free[e] = False
                n_breaks += 1

    if n_breaks:
        notes.append(f"Inserted {n_breaks} short breaks after long focus blocks.")

    # 4) (breaks are reserved while placing focus blocks)
    plan = sorted(plan, key=lambda p: p.start)
    notes += _explain(plan, energy)
    return plan, notes


def _nearest_free(free: np.ndarray, target: int, n: int):
    for d in range(0, DAY_SLOTS):
        for s in (target - d, target + d):
            if 0 <= s <= DAY_SLOTS - n and free[s:s + n].all():
                return s
    return None


def _explain(plan: list[Placed], energy: np.ndarray) -> list[str]:
    out = []
    for p in plan:
        if p.task.focus >= 3 and p.task.category in ("study", "work"):
            out.append(f"'{p.task.name}' scheduled {hhmm(p.start*SLOT)}-{hhmm(p.end*SLOT)} "
                       f"(energy {energy[p.start:p.end].mean():.0%}) - deep focus in a peak window.")
    return out


# --------------------------------------------------------------------------- #
# Convenience
# --------------------------------------------------------------------------- #
def sleep_stats(wake: str, bed: str) -> float:
    return ((parse_hhmm(wake) - parse_hhmm(bed)) % (24 * 60)) / 60


def plan_to_df(plan: list[Placed], energy: np.ndarray) -> pd.DataFrame:
    return pd.DataFrame([{
        "Start": hhmm(p.start * SLOT), "End": hhmm(p.end * SLOT),
        "Task": p.task.name, "Category": p.task.category,
        "Minutes": p.task.minutes, "Focus": p.task.focus,
        "Energy %": round(float(energy[p.start:p.end].mean()) * 100),
    } for p in sorted(plan, key=lambda p: p.start)])


def sample_student_day() -> list[Task]:
    """Typical engineering-student day used in the demo and the report.
    current_start = what the student does today (messy, unplanned)."""
    h = lambda hh, mm=0: hh * 60 + mm
    return [
        Task("Commute to college", "commute", 45, 3, 1, fixed_start=h(8, 15)),
        Task("Morning lectures", "study", 210, 5, 2, fixed_start=h(9)),
        Task("Afternoon lectures", "study", 150, 5, 2, fixed_start=h(13, 30)),
        Task("Commute home", "commute", 45, 3, 1, fixed_start=h(16)),
        Task("Assignment / coding project", "study", 120, 5, 3, current_start=h(19, 15)),
        Task("Revise lecture notes", "study", 45, 4, 2, current_start=h(21, 15)),
        Task("Blockchain internship course", "study", 45, 4, 3, current_start=h(22)),
        Task("Scroll social media", "leisure", 45, 1, 1, current_start=h(17, 15)),
        Task("Gaming / series", "leisure", 45, 2, 1, current_start=h(18)),
        Task("Household chores", "chores", 30, 2, 1, current_start=h(18, 45)),
        Task("Lunch", "meal", 30, 4, 1, current_start=h(16, 45)),
        Task("Dinner", "meal", 30, 4, 1, current_start=h(23, 15)),
    ]
