const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, ShadingType, PageBreak,
  Footer, PageNumber, TableOfContents, Header,
} = require("docx");

const R = JSON.parse(fs.readFileSync("data/results.json"));
const N = R.chronotypes.neutral;
const FONT = "Calibri";
const NAVY = "1F3864";
const W = 9026; // A4 content width in DXA (1" margins)

// ---------- helpers
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 300 }, alignment: opts.align || AlignmentType.JUSTIFIED,
  ...opts.para,
  children: Array.isArray(text) ? text : [new TextRun({ text, ...(opts.run || {}) })],
});
const b = (t) => new TextRun({ text: t, bold: true });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const bullet = (children) => new Paragraph({
  numbering: { reference: "bul", level: 0 }, spacing: { after: 60, line: 288 },
  children: Array.isArray(children) ? children : [new TextRun(children)],
});
const num = (children, ref = "num") => new Paragraph({
  numbering: { reference: ref, level: 0 }, spacing: { after: 60, line: 288 },
  children: Array.isArray(children) ? children : [new TextRun(children)],
});
const img = (file, w, h, caption) => [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
    children: [new ImageRun({ type: "png", data: fs.readFileSync(file), transformation: { width: w, height: h },
      altText: { title: caption, description: caption, name: caption } })],
  }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: caption, italics: true, size: 20, color: "444444" })] }),
];
const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
function table(headers, rows, widths, opts = {}) {
  const cell = (t, w, head, i) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: head ? { fill: NAVY, type: ShadingType.CLEAR, color: "auto" }
      : (opts.zebra && opts.zebra(i) ? { fill: "EEF3FA", type: ShadingType.CLEAR, color: "auto" } : undefined),
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [new Paragraph({ alignment: opts.center && opts.center.includes(widths.indexOf(w)) ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text: String(t), bold: head, color: head ? "FFFFFF" : "000000", size: 20 })] })],
  });
  return new Table({
    width: { size: widths.reduce((a, c) => a + c, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((t, i) => cell(t, widths[i], true)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, widths[i], false, ri)) })),
    ],
  });
}
const gap = () => new Paragraph({ spacing: { after: 160 }, children: [] });
const f1 = (x) => x.toFixed(1);

// ---------- cover
const cover = [
  new Paragraph({ spacing: { before: 1400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "VALUE ADDED COURSE PROJECT REPORT", size: 24, bold: true, color: "666666", characterSpacing: 40 })] }),
  new Paragraph({ spacing: { before: 600, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "AI-Powered Daily Routine Redesign", size: 60, bold: true, color: NAVY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 12 } },
    children: [new TextRun({ text: "An energy-aware, machine-learning approach to scheduling a student's day", size: 26, italics: true, color: "444444" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 80 },
    children: [new TextRun({ text: "Submitted by", size: 22, color: "666666" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Periyannan Ratish N", size: 32, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "B.Tech - Artificial Intelligence & Data Science (III Year)", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: "Dhanalakshmi College of Engineering", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 500 },
    children: [new TextRun({ text: "October 2026", size: 24, color: "444444" })] }),
  new Paragraph({ children: [new PageBreak()] }),
];

const toc = [
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Table of Contents", size: 32, bold: true, color: NAVY })] }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---------- body
const body = [
  h1("Abstract"),
  p("Most students and professionals plan their day by habit rather than by evidence. Deep, demanding work is pushed into low-energy hours, meals and sleep drift, exercise is skipped, and screen time fills the gaps. This project presents an AI-powered system that redesigns a person's daily routine. The user supplies their tasks, durations, fixed commitments and sleep habits. The system then (i) models the person's circadian energy curve, (ii) rebuilds the schedule with a constraint-based optimizer that places deep-focus work in energy peaks, protects sleep, and inserts meals, exercise and breaks, and (iii) evaluates the old and new routine with two Gradient Boosting models that predict a Productivity score and a Wellbeing score."),
  p(`On a representative engineering-student day, the redesign raised predicted productivity from ${f1(N.before.productivity)} to ${f1(N.after.productivity)} (out of 100) and predicted wellbeing from ${f1(N.before.wellbeing)} to ${f1(N.after.wellbeing)}, while lifting the share of focus work done in high-energy windows from ${Math.round(N.features_before.peak_focus_ratio * 100)}% to ${Math.round(N.features_after.peak_focus_ratio * 100)}%. The prediction models reach R² of ${R.metrics.productivity.r2.toFixed(2)} (productivity) and ${R.metrics.wellbeing.r2.toFixed(2)} (wellbeing) on held-out data. The system is delivered as a Python library and an interactive Streamlit application.`),
  p([b("Keywords: "), new TextRun("daily routine optimization, circadian rhythm, time-blocking, gradient boosting, constraint-based scheduling, productivity, wellbeing.")]),

  h1("1. Introduction"),
  p("Time is the one resource every student gets in equal amounts, yet outcomes differ widely depending on how the day is arranged. Research on sleep and cognition consistently shows that attention, memory and mood vary across the day and degrade sharply with insufficient or irregular sleep. Productivity methods such as time-blocking, the Pomodoro Technique and deep-work scheduling help, but they are generic: they do not account for an individual's energy pattern, their fixed timetable, or the trade-offs between study, health and rest."),
  p("Artificial intelligence can close this gap. A model can learn how routine features such as sleep duration, exercise, breaks and the timing of focus work relate to how productive and well a person feels, and an optimizer can then search for a better arrangement of the same tasks. This project builds such a system end to end."),
  h2("1.1 Problem statement"),
  p("Given a set of daily tasks with durations, priorities, concentration requirements and some fixed commitments, together with a person's chronotype and sleep habits, produce a feasible schedule that increases predicted productivity and wellbeing compared with the person's current routine, and explain why each change was made."),
  h2("1.2 Objectives"),
  num("Model the person's daily energy rhythm for morning, neutral and night chronotypes."),
  num("Train machine-learning models that predict productivity and wellbeing from routine features."),
  num("Design a constraint-aware optimizer that rebuilds the day around energy, health essentials and priorities."),
  num("Quantify the benefit by comparing the original and redesigned routines, including an ablation of what contributes most."),
  num("Deliver a usable interactive application with transparent explanations."),
  h2("1.3 Scope"),
  p("The system plans a single day for one person. It does not integrate with calendars or wearables, and its prediction models are trained on simulated data derived from published findings (Section 4.1), so scores should be read as relative guidance, not clinical measurements."),

  h1("2. Background and Related Concepts"),
  bullet([b("Circadian rhythm. "), new TextRun("Alertness follows a roughly 24-hour cycle with a late-morning peak, a post-lunch dip and a smaller early-evening peak. Chronotype shifts this curve earlier (morning types) or later (night types).")]),
  bullet([b("Sleep. "), new TextRun("Consensus guidance recommends 7 to 9 hours of sleep for young adults (Hirshkowitz et al., 2015). Short or irregular sleep reduces attention and mood.")]),
  bullet([b("Deep work and time-blocking. "), new TextRun("Demanding cognitive work benefits from long uninterrupted blocks placed when focus is highest (Newport, 2016).")]),
  bullet([b("Breaks. "), new TextRun("Short breaks between focus sessions, as in the Pomodoro Technique (Cirillo, 2006), help sustain performance.")]),
  bullet([b("Gradient boosting. "), new TextRun("An ensemble of shallow decision trees built sequentially to correct earlier errors (Friedman, 2001); effective on small tabular data and able to expose feature importances.")]),

  h1("3. System Architecture"),
  p("The system has four stages that run in sequence, each implemented as a function in the engine module and surfaced through the web interface."),
  table(["Stage", "Component", "What it does"],
    [["1", "Input layer", "User enters tasks (duration, priority 1-5, focus 1-3, fixed or current start), chronotype, current and target sleep times."],
     ["2", "Energy model", "Generates a 96-slot (15-minute) circadian energy curve for the chosen chronotype."],
     ["3", "Optimizer", "Places tasks using constraints and energy matching; adds meals, exercise and breaks."],
     ["4", "Evaluator", "Converts any schedule into 11 features and predicts Productivity and Wellbeing; produces the before/after comparison and explanations."]],
    [900, 2000, 6126], { center: [0] }),
  gap(),

  h1("4. Methodology"),
  h2("4.1 Dataset"),
  p(`Real, fine-grained routine data linked to outcome scores is private and hard to collect, so a synthetic dataset of ${R.n_rows.toLocaleString()} daily logs was generated. Each log contains 11 routine features and two outcome scores. The relationships built into the generator follow widely reported findings: productivity and wellbeing peak near 8 hours of sleep and fall off on either side; study time has diminishing returns beyond roughly 8 hours; exercise, regular meals and regular sleep help; heavy screen time and frequent task switching hurt; and working in high-energy windows raises productivity. Gaussian noise was added so that the learning problem is not trivially deterministic.`),
  table(["Feature", "Meaning"],
    [["sleep_hours", "Hours of sleep between bed time and wake time"],
     ["sleep_consistency", "Regularity of sleep schedule (0-1)"],
     ["study_hours", "Total hours of study and work"],
     ["peak_focus_ratio", "Share of focus work done when energy >= 60%"],
     ["exercise_min", "Minutes of exercise"],
     ["screen_hours", "Estimated daily screen time"],
     ["break_count", "Short breaks after focus blocks"],
     ["meal_regularity", "How evenly spaced and complete the meals are (0-1)"],
     ["leisure_hours", "Hours of leisure"],
     ["task_switches", "Number of separate activities in the day"],
     ["free_buffer_min", "Unscheduled minutes (slack for overruns)"]],
    [2600, 6426]),
  gap(),
  h2("4.2 Prediction models"),
  p(`Two Gradient Boosting regressors (scikit-learn; 250 trees, depth 3, learning rate 0.06) were trained on an 80/20 train-test split, one for Productivity and one for Wellbeing. On the held-out 20%, the Productivity model achieved R² = ${R.metrics.productivity.r2.toFixed(2)} with a mean absolute error of ${R.metrics.productivity.mae.toFixed(1)} points, and the Wellbeing model achieved R² = ${R.metrics.wellbeing.r2.toFixed(2)} with an MAE of ${R.metrics.wellbeing.mae.toFixed(1)} points. The remaining variance is the injected noise, which no model should recover.`),
  ...img("assets/feature_importance.png", 580, 244, "Figure 1: Feature importance of the Productivity and Wellbeing models"),
  p("Figure 1 shows that productivity is driven mainly by when focus work happens and by taking breaks, while wellbeing is driven mainly by exercise and sleep duration. These are the levers the optimizer then acts on."),
  h2("4.3 Energy model"),
  p("Energy is modelled as a sum of Gaussian components: a late-morning peak, a smaller early-evening peak, a post-lunch dip and a deep overnight trough. Shifting the curve earlier by 1.5 hours or later by 2.5 hours produces morning and night chronotypes (Figure 2)."),
  ...img("assets/energy_curves.png", 460, 207, "Figure 2: Circadian energy model by chronotype"),
  h2("4.4 Optimizer"),
  p("The scheduler works on a 15-minute grid between the target wake and bed times. It follows these steps:"),
  num([b("Reserve fixed tasks "), new TextRun("such as lectures and commutes; they never move.")], "num2"),
  num([b("Add essentials "), new TextRun("if missing: breakfast, lunch, dinner and 30 minutes of exercise.")], "num2"),
  num([b("Anchor meals "), new TextRun("near regular times (07:30, 13:00, 19:30) to raise meal regularity.")], "num2"),
  num([b("Rank the remaining tasks "), new TextRun("by 2 x focus + priority so that the most demanding, important work chooses its slot first.")], "num2"),
  num([b("Score every feasible start time. "), new TextRun("Deep-focus tasks maximise average energy weighted by focus and priority; exercise targets moderate energy and avoids very early hours; light tasks (chores, leisure) are steered into low-energy windows, with leisure kept after 17:00 as a wind-down activity.")], "num2"),
  num([b("Insert a 15-minute break "), new TextRun("after every focus block of an hour or more.")], "num2"),
  num([b("Report anything that does not fit "), new TextRun("instead of silently overloading the day.")], "num2"),
  p("This greedy, priority-ordered strategy is fast, deterministic and easy to explain. It is not guaranteed to find the global optimum; Section 7 discusses stronger alternatives."),
  h2("4.5 Evaluation protocol"),
  p("Both the person's current schedule and the redesigned schedule are converted into the same 11 features and scored by the trained models. A fixed set of sample tasks representing a typical engineering-student day was used: 6 hours of lectures, two commutes, a coding assignment, note revision, a blockchain course, social media, gaming, chores and two meals. The current day was given realistic but unplanned start times (late lunch, dinner at 23:15, deep work after 19:00, no exercise) and 6.5 hours of irregular sleep."),

  h1("5. Implementation"),
  p("The system is written in Python 3 using pandas, NumPy, scikit-learn and matplotlib, with Streamlit for the interface."),
  table(["File", "Role"],
    [["engine.py", "Task model, energy curve, synthetic data, model training, optimizer, evaluator"],
     ["app.py", "Streamlit interface: editable task table, sidebar for sleep and chronotype, metrics, before/after timeline, explanations"],
     ["run_experiment.py", "Reproduces every figure and number in this report"],
     ["data/", "Synthetic dataset (CSV) and results (JSON)"],
     ["requirements.txt, README.md", "Dependencies and run instructions"]],
    [2600, 6426]),
  gap(),
  p("To run the application: install the requirements and execute `streamlit run app.py`. The app trains the models once on start-up (a few seconds), then lets the user edit tasks and press “Redesign my day”. The interface displays predicted score changes, a coloured before/after timeline overlaid on the energy curve, both schedules as tables, and plain-language reasons for the changes."),

  h1("6. Results and Discussion"),
  h2("6.1 Redesign of the sample day"),
  ...img("assets/timeline_before_after.png", 600, 251, "Figure 3: Original (top) versus AI-redesigned (bottom) day for a neutral chronotype"),
  p("In the original day the coding assignment is done between 19:15 and 21:15 and the internship course at 22:00, when energy is already falling. Lunch is at 16:45, dinner at 23:15, and there is no exercise or break. In the redesigned day, the assignment moves to the 16:45 to 18:45 energy window (76% energy), a break and 30 minutes of exercise follow, meals sit at regular times, and chores and gaming move to the low-energy end of the evening. Bedtime moves to 22:45."),
  table(["Time", "Task", "Energy"],
    N.schedule_after.map(r => [`${r.Start} - ${r.End}`, r.Task, `${r["Energy %"]}%`]),
    [2200, 5426, 1400], { center: [2], zebra: (i) => i % 2 === 1 }),
  p([new TextRun({ text: "Table: redesigned schedule for the neutral chronotype.", italics: true, size: 20, color: "444444" })], { align: AlignmentType.CENTER }),
  p("One trade-off is worth stating plainly. The day is almost fully booked, so the optimizer could not fit the 45-minute social-media block while also protecting sleep, a meal pattern and exercise. It reported this instead of hiding it. Because leisure time is part of wellbeing, a real user may prefer to shorten another task to keep it."),
  h2("6.2 Change in predicted scores"),
  table(["Chronotype", "Productivity before", "Productivity after", "Wellbeing before", "Wellbeing after"],
    ["morning", "neutral", "night"].map(c => {
      const x = R.chronotypes[c];
      return [c[0].toUpperCase() + c.slice(1), f1(x.before.productivity), f1(x.after.productivity), f1(x.before.wellbeing), f1(x.after.wellbeing)];
    }),
    [1826, 1800, 1800, 1800, 1800], { center: [1, 2, 3, 4] }),
  gap(),
  ...img("assets/score_comparison.png", 480, 228, "Figure 4: Predicted productivity and wellbeing before and after redesign"),
  p(`For all three chronotypes productivity rose by roughly 7 to 11 points and wellbeing by roughly 13 to 14 points. For the neutral chronotype the gains are +${f1(N.after.productivity - N.before.productivity)} productivity and +${f1(N.after.wellbeing - N.before.wellbeing)} wellbeing.`),
  h2("6.3 What changed in the features"),
  table(["Feature", "Before", "After"],
    ["sleep_hours", "sleep_consistency", "peak_focus_ratio", "exercise_min", "break_count", "meal_regularity", "leisure_hours", "screen_hours", "free_buffer_min"]
      .map(k => [k.replace(/_/g, " "), String(N.features_before[k]), String(N.features_after[k])]),
    [4026, 2500, 2500], { center: [1, 2], zebra: (i) => i % 2 === 1 }),
  gap(),
  h2("6.4 Ablation: which change matters most?"),
  p("To separate the effect of better sleep from the effect of a better schedule, the models scored four versions of the day (Figure 5)."),
  ...img("assets/ablation.png", 480, 216, "Figure 5: Contribution of each change to predicted scores"),
  p(`Improving sleep alone lifts wellbeing from ${f1(R.ablation["Original day"][1])} to ${f1(R.ablation["+ Better sleep (7.75 h, regular)"][1])} but productivity only from ${f1(R.ablation["Original day"][0])} to ${f1(R.ablation["+ Better sleep (7.75 h, regular)"][0])}. Rescheduling alone gives a larger productivity gain (${f1(R.ablation["+ Optimized schedule only"][0])}) and a similar wellbeing gain. The two together are best (${f1(R.ablation["Full redesign"][0])} and ${f1(R.ablation["Full redesign"][1])}), so the recommendations reinforce each other.`),
  h2("6.5 Limitations"),
  bullet("The training data is simulated. The direction of the effects follows published research, but the exact magnitudes are assumptions, so the predicted gains are not proof of real-world improvement."),
  bullet("The optimizer is greedy and schedules one day at a time; it can be beaten by a global search on tightly packed days."),
  bullet("Screen time and sleep consistency are estimated from the plan, not measured."),
  bullet("The energy curve is a population-style template; individuals differ."),
  bullet("The tool gives planning guidance, not medical advice."),

  h1("7. Future Scope"),
  bullet("Replace the synthetic data with real logs from a consented pilot study or wearable data, and retrain the models."),
  bullet("Use integer linear programming, genetic algorithms or reinforcement learning to search schedules globally."),
  bullet("Personalise the energy curve from the user's own self-ratings across days."),
  bullet("Integrate with Google Calendar and phone usage statistics."),
  bullet("Generate weekly plans with deadline awareness and spaced revision."),
  bullet("Add a conversational interface using a large language model to explain and negotiate the plan."),

  h1("8. Conclusion"),
  p(`This project demonstrates a complete pipeline for AI-assisted routine design: an energy model, predictive models, a constraint-based optimizer and an explanatory interface. On a realistic student day, the redesigned routine was predicted to improve productivity by ${f1(N.after.productivity - N.before.productivity)} points and wellbeing by ${f1(N.after.wellbeing - N.before.wellbeing)} points by moving deep work into energy peaks, adding exercise, breaks and regular meals, and protecting sleep. The ablation shows that scheduling and sleep each help and help most together. With real user data, the same framework can become a practical personal planning assistant.`),

  h1("References"),
  ...[
    "Cirillo, F. (2006). The Pomodoro Technique. Self-published.",
    "Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. Annals of Statistics, 29(5), 1189-1232.",
    "Hirshkowitz, M., et al. (2015). National Sleep Foundation's sleep time duration recommendations: methodology and results summary. Sleep Health, 1(1), 40-43.",
    "Newport, C. (2016). Deep Work: Rules for Focused Success in a Distracted World. Grand Central Publishing.",
    "Pedregosa, F., et al. (2011). Scikit-learn: Machine learning in Python. Journal of Machine Learning Research, 12, 2825-2830.",
  ].map(t => new Paragraph({ spacing: { after: 100 }, indent: { left: 360, hanging: 360 }, children: [new TextRun(t)] })),
];

const doc = new Document({
  creator: "Periyannan Ratish N",
  title: "AI-Powered Daily Routine Redesign",
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: NAVY, font: FONT },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "2F5496", font: FONT },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "AI-Powered Daily Routine Redesign  |  Page ", size: 18, color: "777777" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "777777" })] })] }) },
    children: [...cover, ...body],
  }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync("AI_Daily_Routine_Redesign_Report.docx", buf); console.log("ok"); });
