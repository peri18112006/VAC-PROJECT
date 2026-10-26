"""Runs the full experiment headlessly: trains models, redesigns the sample
student day for three chronotypes, saves charts + results used in the report/PPT."""
import json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import engine as E

plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False,
                     "axes.spines.right": False})
COL = {"study": "#4C78A8", "work": "#4C78A8", "exercise": "#54A24B", "meal": "#F58518",
       "leisure": "#B279A2", "chores": "#9D755D", "social": "#E45756",
       "commute": "#BAB0AC", "sleep": "#72B7B2", "break": "#EECA3B"}

df = E.generate_dataset()
df.to_csv("data/synthetic_routines.csv", index=False)
models = E.train_models(df)
tasks = E.sample_student_day()
res = {"metrics": models.metrics, "n_rows": len(df), "chronotypes": {}}

# ---------- model chart
imp = models.importance.set_index("feature")
fig, axs = plt.subplots(1, 2, figsize=(10, 4.2), sharey=True)
for ax, tgt, c in zip(axs, ("productivity", "wellbeing"), ("#4C78A8", "#54A24B")):
    s = imp[tgt].sort_values()
    ax.barh(s.index.str.replace("_", " "), s.values, color=c)
    ax.set_title(f"Drivers of {tgt}")
    ax.set_xlabel("Feature importance")
fig.tight_layout()
fig.savefig("assets/feature_importance.png", dpi=180)
plt.close(fig)

# ---------- main experiment (neutral)
for chrono in ("morning", "neutral", "night"):
    en = E.energy_curve(chrono)
    before = E.build_original(tasks)
    wake, bed = {"morning": ("06:00", "22:15"), "neutral": ("06:30", "22:45"),
                 "night": ("07:30", "23:45")}[chrono]
    after, notes = E.optimize(tasks, chrono, wake, bed)
    e0 = E.evaluate(before, models, en, 6.5, 0.4)
    e1 = E.evaluate(after, models, en, E.sleep_stats(wake, bed), 0.9)
    res["chronotypes"][chrono] = {
        "wake": wake, "bed": bed,
        "before": {k: round(e0[k], 1) for k in ("productivity", "wellbeing")},
        "after": {k: round(e1[k], 1) for k in ("productivity", "wellbeing")},
        "features_before": {k: round(v, 2) for k, v in e0["features"].items()},
        "features_after": {k: round(v, 2) for k, v in e1["features"].items()},
        "notes": notes,
        "schedule_after": E.plan_to_df(after, en).to_dict("records"),
        "schedule_before": E.plan_to_df(before, en).to_dict("records"),
    }
    if chrono == "neutral":
        fig, axes = plt.subplots(2, 1, figsize=(11, 4.6), sharex=True)
        for ax, plan, title in zip(axes, (before, after), ("Before: unplanned day", "After: AI-redesigned day")):
            ax2 = ax.twinx()
            ax2.fill_between(np.arange(E.DAY_SLOTS) * E.SLOT / 60, en, color="#888", alpha=0.15)
            ax2.set_yticks([]); ax2.spines[:].set_visible(False)
            for p in plan:
                ax.barh(0, p.task.minutes / 60, left=p.start * E.SLOT / 60, height=0.62,
                        color=COL.get(p.task.category, "#888"), edgecolor="white")
            ax.set_yticks([]); ax.set_xlim(6, 24); ax.set_title(title, loc="left", fontsize=11)
            ax.spines["left"].set_visible(False)
        axes[1].set_xlabel("Hour of day (grey area = circadian energy level)")
        hs = [plt.Rectangle((0, 0), 1, 1, color=c) for k, c in COL.items() if k != "work"]
        fig.legend(hs, [k for k in COL if k != "work"], ncol=9, loc="lower center", fontsize=8, frameon=False)
        fig.tight_layout(rect=(0, 0.07, 1, 1))
        fig.savefig("assets/timeline_before_after.png", dpi=180)
        plt.close(fig)

# ---------- energy curves chart
fig, ax = plt.subplots(figsize=(8, 3.6))
t = np.arange(E.DAY_SLOTS) * E.SLOT / 60
for c, col in zip(("morning", "neutral", "night"), ("#F58518", "#4C78A8", "#B279A2")):
    ax.plot(t, E.energy_curve(c), label=c, color=col, lw=2)
ax.set_xlim(5, 24); ax.set_xlabel("Hour of day"); ax.set_ylabel("Relative energy")
ax.set_title("Circadian energy model by chronotype"); ax.legend(frameon=False)
fig.tight_layout(); fig.savefig("assets/energy_curves.png", dpi=180); plt.close(fig)

# ---------- before/after scores chart
fig, ax = plt.subplots(figsize=(8, 3.8))
x = np.arange(3); w = 0.2
labs = ["morning", "neutral", "night"]
for i, (key, kind, col) in enumerate([("productivity", "before", "#BAB0AC"), ("productivity", "after", "#4C78A8"),
                                       ("wellbeing", "before", "#D4E6C8"), ("wellbeing", "after", "#54A24B")]):
    vals = [res["chronotypes"][c][kind][key] for c in labs]
    b = ax.bar(x + (i - 1.5) * w, vals, w, color=col, label=f"{key} ({kind})")
    for r, v in zip(b, vals):
        ax.text(r.get_x() + r.get_width() / 2, v + 0.8, f"{v:.0f}", ha="center", fontsize=8)
ax.set_xticks(x); ax.set_xticklabels([l.capitalize() for l in labs]); ax.set_ylim(0, 100)
ax.set_ylabel("Predicted score (0-100)"); ax.set_title("Predicted impact of the redesign")
ax.legend(frameon=False, fontsize=8, ncol=2, loc="upper left"); fig.tight_layout()
fig.savefig("assets/score_comparison.png", dpi=180); plt.close(fig)

# ---------- ablation: which change matters? (neutral)
en = E.energy_curve("neutral")
def score(plan, sleep, cons):
    e = E.evaluate(plan, models, en, sleep, cons); return e["productivity"], e["wellbeing"]
before = E.build_original(tasks)
after, _ = E.optimize(tasks, "neutral", "06:30", "22:45")
base = score(before, 6.5, 0.4)
abl = {"Original day": base,
       "+ Better sleep (7.75 h, regular)": score(before, 7.75, 0.9),
       "+ Optimized schedule only": score(after, 6.5, 0.4),
       "Full redesign": score(after, 7.75, 0.9)}
res["ablation"] = {k: [round(v[0], 1), round(v[1], 1)] for k, v in abl.items()}
fig, ax = plt.subplots(figsize=(8, 3.6))
names = list(abl); xs = np.arange(len(names))
ax.bar(xs - 0.2, [abl[n][0] for n in names], 0.4, label="Productivity", color="#4C78A8")
ax.bar(xs + 0.2, [abl[n][1] for n in names], 0.4, label="Wellbeing", color="#54A24B")
ax.set_xticks(xs); ax.set_xticklabels([n.replace(" (", "\n(") for n in names], fontsize=8)
ax.set_ylim(0, 100); ax.set_title("Ablation: contribution of each change"); ax.legend(frameon=False)
fig.tight_layout(); fig.savefig("assets/ablation.png", dpi=180); plt.close(fig)

json.dump(res, open("data/results.json", "w"), indent=2)
print(json.dumps({k: res[k] for k in ("metrics", "ablation")}, indent=1))
for c, v in res["chronotypes"].items():
    print(c, v["before"], "->", v["after"])
