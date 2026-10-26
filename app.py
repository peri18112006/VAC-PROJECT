"""Streamlit UI for the AI-Powered Daily Routine Redesign project.
Run:  streamlit run app.py
"""
import numpy as np
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt

import engine as E

st.set_page_config(page_title="AI Daily Routine Redesign", page_icon="🗓️", layout="wide")


@st.cache_resource
def get_models():
    return E.train_models()


models = get_models()

st.title("🗓️ AI-Powered Daily Routine Redesign")
st.caption("Enter your day, and an ML-guided, energy-aware scheduler rebuilds it for better "
           "productivity and wellbeing.")

# ---------------------------- sidebar ---------------------------------------
with st.sidebar:
    st.header("About you")
    chrono = st.selectbox("Chronotype", ["morning", "neutral", "night"], index=1,
                          help="When your energy naturally peaks.")
    st.subheader("Current habits")
    cur_wake = st.time_input("Wake time (now)", value=pd.Timestamp("07:00").time())
    cur_bed = st.time_input("Bed time (now)", value=pd.Timestamp("00:30").time())
    cur_consistency = st.slider("How regular is your sleep? (0-1)", 0.0, 1.0, 0.4, 0.05)
    st.subheader("Redesigned day")
    new_wake = st.time_input("Target wake time", value=pd.Timestamp("06:30").time())
    new_bed = st.time_input("Target bed time", value=pd.Timestamp("22:45").time())
    add_breaks = st.checkbox("Insert short breaks", True)
    add_essentials = st.checkbox("Add missing meals / exercise", True)
    st.divider()
    st.metric("Model R² (productivity)", f"{models.metrics['productivity']['r2']:.2f}")
    st.metric("Model R² (wellbeing)", f"{models.metrics['wellbeing']['r2']:.2f}")

# ---------------------------- task editor -----------------------------------
st.subheader("1. Your tasks")
st.caption("Fixed start = cannot move (classes, commute). Current start = when you do it today.")


def to_df(tasks):
    fmt = lambda m: "" if m is None else E.hhmm(m)
    return pd.DataFrame([{
        "Task": t.name, "Category": t.category, "Minutes": t.minutes,
        "Priority (1-5)": t.priority, "Focus (1-3)": t.focus,
        "Fixed start": fmt(t.fixed_start), "Current start": fmt(t.current_start),
    } for t in tasks])


if "tasks_df" not in st.session_state:
    st.session_state.tasks_df = to_df(E.sample_student_day())

edited = st.data_editor(
    st.session_state.tasks_df, num_rows="dynamic", width="stretch",
    column_config={
        "Category": st.column_config.SelectboxColumn(options=E.CATEGORIES),
        "Minutes": st.column_config.NumberColumn(min_value=15, max_value=600, step=15),
        "Priority (1-5)": st.column_config.NumberColumn(min_value=1, max_value=5),
        "Focus (1-3)": st.column_config.NumberColumn(min_value=1, max_value=3),
    })


def from_df(df):
    tasks = []
    for _, r in df.iterrows():
        if not str(r["Task"]).strip() or str(r["Task"]) == "nan":
            continue
        def tm(v):
            v = "" if v is None else str(v).strip()
            return None if v in ("", "nan", "None") else E.parse_hhmm(v)
        tasks.append(E.Task(str(r["Task"]), str(r["Category"]), int(r["Minutes"]),
                            int(r["Priority (1-5)"]), int(r["Focus (1-3)"]),
                            tm(r["Fixed start"]), tm(r["Current start"])))
    return tasks


# ---------------------------- run -------------------------------------------
if st.button("✨ Redesign my day", type="primary"):
    try:
        tasks = from_df(edited)
        energy = E.energy_curve(chrono)
        before = E.build_original(tasks)
        after, notes = E.optimize(tasks, chrono, new_wake.strftime("%H:%M"),
                                  new_bed.strftime("%H:%M"), add_breaks, add_essentials)
        s0 = E.sleep_stats(cur_wake.strftime("%H:%M"), cur_bed.strftime("%H:%M"))
        s1 = E.sleep_stats(new_wake.strftime("%H:%M"), new_bed.strftime("%H:%M"))
        e0 = E.evaluate(before, models, energy, s0, cur_consistency)
        e1 = E.evaluate(after, models, energy, s1, 0.9)
        st.session_state.result = (before, after, notes, e0, e1, energy, s0, s1)
    except Exception as ex:  # keep the UI friendly for bad input
        st.error(f"Could not build the schedule: {ex}")

if "result" in st.session_state:
    before, after, notes, e0, e1, energy, s0, s1 = st.session_state.result
    st.subheader("2. Predicted impact")
    c1, c2, c3 = st.columns(3)
    c1.metric("Productivity", f"{e1['productivity']:.0f}/100",
              f"{e1['productivity'] - e0['productivity']:+.1f}")
    c2.metric("Wellbeing", f"{e1['wellbeing']:.0f}/100",
              f"{e1['wellbeing'] - e0['wellbeing']:+.1f}")
    c3.metric("Sleep", f"{s1:.1f} h", f"{s1 - s0:+.1f} h")

    st.subheader("3. Timeline: before vs after")
    colors = {"study": "#4C78A8", "work": "#4C78A8", "exercise": "#54A24B", "meal": "#F58518",
              "leisure": "#B279A2", "chores": "#9D755D", "social": "#E45756",
              "commute": "#BAB0AC", "sleep": "#72B7B2", "break": "#EECA3B"}
    fig, axes = plt.subplots(2, 1, figsize=(11, 5.2), sharex=True)
    for ax, plan, title in zip(axes, (before, after), ("Before", "After (AI redesign)")):
        ax2 = ax.twinx()
        ax2.fill_between(np.arange(E.DAY_SLOTS) * E.SLOT / 60, energy, color="#999", alpha=0.15)
        ax2.set_yticks([])
        for p in plan:
            ax.barh(0, p.task.minutes / 60, left=p.start * E.SLOT / 60, height=0.6,
                    color=colors.get(p.task.category, "#888"), edgecolor="white")
        ax.set_yticks([])
        ax.set_title(title, loc="left", fontsize=11)
        ax.set_xlim(5, 24)
    axes[1].set_xlabel("Hour of day (grey area = energy level)")
    handles = [plt.Rectangle((0, 0), 1, 1, color=c) for c in colors.values()]
    fig.legend(handles, colors.keys(), ncol=10, loc="lower center", fontsize=8, frameon=False)
    fig.tight_layout(rect=(0, 0.06, 1, 1))
    st.pyplot(fig)

    tab1, tab2, tab3 = st.tabs(["Redesigned schedule", "Original schedule", "Why these changes"])
    tab1.dataframe(E.plan_to_df(after, energy), width="stretch", hide_index=True)
    tab2.dataframe(E.plan_to_df(before, energy), width="stretch", hide_index=True)
    with tab3:
        for n in notes:
            st.write("• " + n)
        st.write("**Feature comparison (inputs to the ML model)**")
        st.dataframe(pd.DataFrame({"Before": e0["features"], "After": e1["features"]}).round(2))
        st.write("**What matters most to the model**")
        st.bar_chart(models.importance.set_index("feature")[["productivity", "wellbeing"]])

st.caption("Model trained on simulated routine data (see report). Treat output as guidance, "
           "not medical advice.")
