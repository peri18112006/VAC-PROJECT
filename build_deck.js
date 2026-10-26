const fs = require("fs");
const pptxgen = require("pptxgenjs");
let applyTheme = null;
try {
  applyTheme = require("/mnt/skills/public/pptx/scripts/apply_theme.js").applyTheme;
} catch (e) {
  // Not in sandbox environment, pptxgenjs native styling is used
}

const R = JSON.parse(fs.readFileSync("data/results.json"));
const N = R.chronotypes.neutral;
const f1 = (x) => x.toFixed(1);

const THEME = {
  name: "Routine Redesign",
  headFontFace: "Calibri", bodyFontFace: "Calibri",
  colors: { dk1: "1B2430", lt1: "FFFFFF", dk2: "1F3864", lt2: "F2F5FA",
    accent1: "2F5496", accent2: "54A24B", accent3: "F58518", accent4: "B279A2",
    accent5: "72B7B2", accent6: "BAB0AC", hlink: "2F5496", folHlink: "6B6B6B" },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "AI-Powered Daily Routine Redesign";
pres.author = "Periyannan Ratish N";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "TITLE_ONLY", background: { color: C.background1 },
  objects: [
    { rect: { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.text2 } } },
  ],
  slideNumber: { x: 9.2, y: 5.25, w: 0.5, h: 0.25, fontSize: 9, color: "8A8F98", align: "right" },
  margin: [0.4, 0.5, 0.4, 0.5],
  placeholders: [{ placeholder: { options: { name: "title", type: "title", x: 0.55, y: 0.3, w: 8.9, h: 0.7,
    fontSize: 26, bold: true, color: C.text2, valign: "middle", margin: 0 }, text: "" } }],
});
pres.defineSlideMaster({
  title: "DARK", background: { color: C.text2 },
  placeholders: [{ placeholder: { options: { name: "title", type: "title", x: 0.8, y: 1.5, w: 8.4, h: 1.3,
    fontSize: 40, bold: true, color: C.background1, valign: "middle", margin: 0 }, text: "" } }],
});

const card = (s, x, y, w, h, name) =>
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.background2 },
    line: { color: "DDE3EE", width: 0.75 }, objectName: name });
const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, color: C.text1, ...o });

const title = (sl, t, dark) => sl.addText(t, dark
  ? { isTextBox: true, x: 0.8, y: 1.5, w: 8.4, h: 1.3, fontSize: 40, bold: true, color: C.background1, valign: "middle", margin: 0, objectName: "Title" }
  : { isTextBox: true, x: 0.55, y: 0.3, w: 8.9, h: 0.7, fontSize: 26, bold: true, color: C.text2, valign: "middle", margin: 0, objectName: "Title" });

// 1 Title
pres.addSection({ title: "Intro" });
let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Intro" });
title(s, "AI-Powered Daily Routine Redesign", true);
txt(s, "An energy-aware, machine-learning scheduler for a student's day", { x: 0.8, y: 2.9, w: 8.4, h: 0.4, fontSize: 16, italic: true, color: "C9D3E6" });
txt(s, [{ text: "Periyannan Ratish N", options: { bold: true, breakLine: true } },
  { text: "B.Tech AI & Data Science, III Year  |  Dhanalakshmi College of Engineering", options: { breakLine: true } },
  { text: "Value Added Course  |  October 2026" }],
  { x: 0.8, y: 3.9, w: 8.4, h: 1.0, fontSize: 13, color: "FFFFFF", paraSpaceAfter: 4 });
s.addNotes("Introduce yourself and the project: an AI system that redesigns a daily routine using energy patterns and ML predictions.");

// 2 Problem
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Intro" });
title(s, "The problem: days are planned by habit");
const probs = [["Hard work, wrong hours", "Deep work lands in low-energy evenings, after the peak has passed."],
  ["Health slips", "Late dinners, no exercise, 6.5 h of irregular sleep."],
  ["Generic advice", "Productivity tips ignore your timetable, energy and trade-offs."]];
probs.forEach((p, i) => {
  const x = 0.55 + i * 3.0;
  card(s, x, 1.3, 2.8, 2.3, `Problem card ${i + 1}`);
  txt(s, p[0], { x: x + 0.2, y: 1.5, w: 2.4, h: 0.7, fontSize: 17, bold: true, color: C.text2 });
  txt(s, p[1], { x: x + 0.2, y: 2.25, w: 2.4, h: 1.2, fontSize: 13 });
});
txt(s, [{ text: "Goal: ", options: { bold: true } },
  { text: "turn a person's task list into a better schedule, and prove the improvement with a model." }],
  { x: 0.55, y: 4.0, w: 8.9, h: 0.8, fontSize: 16 });
s.addNotes("Explain that students know what to do but not when to do it. The project builds a system to answer 'when'.");

// 3 Approach
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Intro" });
title(s, "Approach: four stages");
const stages = [["1", "Input", "Tasks, durations, priority, focus level, fixed commitments, sleep"],
  ["2", "Energy model", "15-minute circadian curve for morning / neutral / night types"],
  ["3", "Optimizer", "Constraint-based scheduler places work by energy and adds essentials"],
  ["4", "Evaluator", "Gradient Boosting predicts Productivity and Wellbeing"]];
stages.forEach((st, i) => {
  const x = 0.55 + i * 2.28;
  card(s, x, 1.4, 2.1, 2.9, `Stage card ${st[0]}`);
  s.addShape(pres.ShapeType.ellipse, { x: x + 0.15, y: 1.55, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: `Stage number ${st[0]}` });
  txt(s, st[0], { x: x + 0.15, y: 1.55, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
  txt(s, st[1], { x: x + 0.15, y: 2.2, w: 1.8, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
  txt(s, st[2], { x: x + 0.15, y: 2.65, w: 1.8, h: 1.5, fontSize: 12 });
});
s.addNotes("Walk left to right through the pipeline. Stage 4 is used to score both the original and the redesigned day.");

// 4 Data & models
pres.addSection({ title: "Method" });
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Method" });
title(s, "Learning what drives productivity and wellbeing");
txt(s, [
  { text: `${R.n_rows.toLocaleString()} simulated daily logs, 11 features`, options: { bullet: true, breakLine: true } },
  { text: "Built from published sleep and focus findings, plus noise", options: { bullet: true, breakLine: true } },
  { text: "Two Gradient Boosting models, 80/20 split", options: { bullet: true } }],
  { x: 0.55, y: 1.2, w: 3.6, h: 1.7, fontSize: 13, paraSpaceAfter: 6 });
[["Productivity", R.metrics.productivity, C.accent1], ["Wellbeing", R.metrics.wellbeing, C.accent2]].forEach((m, i) => {
  const y = 3.05 + i * 1.05;
  card(s, 0.55, y, 3.6, 0.9, `Metric card ${m[0]}`);
  txt(s, m[1].r2.toFixed(2), { x: 0.7, y: y + 0.1, w: 1.2, h: 0.7, fontSize: 30, bold: true, color: m[2], valign: "middle" });
  txt(s, [{ text: `${m[0]} R²`, options: { bold: true, breakLine: true } }, { text: `MAE ${m[1].mae.toFixed(1)} points` }],
    { x: 1.95, y: y + 0.1, w: 2.1, h: 0.7, fontSize: 12, valign: "middle" });
});
s.addImage({ path: "assets/feature_importance.png", x: 4.4, y: 1.3, w: 5.2, h: 2.18, altText: "Feature importance for productivity and wellbeing models" });
txt(s, "Productivity: timing of focus work and breaks.  Wellbeing: exercise and sleep.", { x: 4.4, y: 3.7, w: 5.1, h: 0.7, fontSize: 13, italic: true });
s.addNotes("Be upfront that the data is simulated from published findings. R-squared of about 0.75 is expected because noise was injected.");

// 5 Energy model
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Method" });
title(s, "Energy model: when are you at your best?");
s.addImage({ path: "assets/energy_curves.png", x: 0.55, y: 1.25, w: 5.4, h: 2.4, altText: "Energy curves by chronotype" });
txt(s, [
  { text: "Late-morning peak, post-lunch dip, smaller evening peak", options: { bullet: true, breakLine: true } },
  { text: "Morning types shift 1.5 h earlier", options: { bullet: true, breakLine: true } },
  { text: "Night types shift 2.5 h later", options: { bullet: true, breakLine: true } },
  { text: "Deep work goes to peaks; light tasks to dips", options: { bullet: true } }],
  { x: 6.2, y: 1.4, w: 3.3, h: 2.6, fontSize: 14, paraSpaceAfter: 8 });
s.addNotes("The curve is a template; future work personalizes it from the user's own ratings.");

// 6 Optimizer
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Method" });
title(s, "Optimizer: simple rules, clear reasons");
const rules = ["Fixed tasks (lectures, commute) never move", "Missing breakfast, lunch, dinner and 30 min exercise are added",
  "Meals anchored near 07:30, 13:00, 19:30", "Hardest, highest-priority tasks pick energy peaks first",
  "Leisure only after 17:00; chores in dips", "15-minute break after each focus block of 60 min or more",
  "Tasks that do not fit are reported, not hidden"];
rules.forEach((r, i) => {
  const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
  const x = 0.55 + col * 4.55, y = 1.25 + row * 0.95;
  card(s, x, y, 4.35, 0.8, `Rule card ${i + 1}`);
  txt(s, String(i + 1), { x: x + 0.15, y, w: 0.4, h: 0.8, fontSize: 20, bold: true, color: C.accent1, valign: "middle" });
  txt(s, r, { x: x + 0.65, y, w: 3.55, h: 0.8, fontSize: 13, valign: "middle" });
});
s.addNotes("Greedy and priority ordered: fast and explainable, though not guaranteed globally optimal.");

// 7 Before / after
pres.addSection({ title: "Results" });
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Results" });
title(s, "Same tasks, rearranged");
s.addImage({ path: "assets/timeline_before_after.png", x: 0.55, y: 1.15, w: 8.9, h: 3.72, altText: "Timeline of the original and redesigned day" });
txt(s, "Coding assignment moves to the 76% energy window at 16:45. Exercise, a break and regular meals are added; bedtime moves to 22:45.",
  { x: 0.55, y: 4.9, w: 8.9, h: 0.45, fontSize: 12, italic: true });
s.addNotes("Point out the assignment: 19:15 to 21:15 originally, now 16:45 to 18:45. Mention the social media block was dropped to protect sleep.");

// 8 Scores
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Results" });
title(s, "Predicted impact");
const dP = N.after.productivity - N.before.productivity, dW = N.after.wellbeing - N.before.wellbeing;
[["+" + f1(dP), "productivity", `${f1(N.before.productivity)} to ${f1(N.after.productivity)}`, C.accent1],
 ["+" + f1(dW), "wellbeing", `${f1(N.before.wellbeing)} to ${f1(N.after.wellbeing)}`, C.accent2],
 ["+1.25 h", "sleep", "6.5 h to 7.75 h", C.accent3]].forEach((k, i) => {
  const y = 1.3 + i * 1.3;
  card(s, 0.55, y, 3.2, 1.15, `KPI card ${k[1]}`);
  txt(s, k[0], { x: 0.7, y: y + 0.1, w: 1.6, h: 0.95, fontSize: 30, bold: true, color: k[3], valign: "middle" });
  txt(s, [{ text: k[1], options: { bold: true, breakLine: true } }, { text: k[2] }], { x: 2.3, y: y + 0.1, w: 1.4, h: 0.95, fontSize: 12, valign: "middle" });
});
const labs = ["Morning", "Neutral", "Night"], ks = ["morning", "neutral", "night"];
s.addChart(pres.charts.BAR, [
  { name: "Productivity before", labels: labs, values: ks.map(k => R.chronotypes[k].before.productivity) },
  { name: "Productivity after", labels: labs, values: ks.map(k => R.chronotypes[k].after.productivity) },
  { name: "Wellbeing before", labels: labs, values: ks.map(k => R.chronotypes[k].before.wellbeing) },
  { name: "Wellbeing after", labels: labs, values: ks.map(k => R.chronotypes[k].after.wellbeing) },
], { x: 4.0, y: 1.2, w: 5.5, h: 3.9, barDir: "col", barGrouping: "clustered",
  chartColors: ["BAB0AC", "2F5496", "C5E0C0", "54A24B"], showLegend: true, legendPos: "b", legendFontSize: 10,
  showValue: true, dataLabelFontSize: 9, dataLabelFormatCode: "0", dataLabelPosition: "outEnd",
  valAxisMinVal: 0, valAxisMaxVal: 100, valAxisLabelFontSize: 10, catAxisLabelFontSize: 11,
  valGridLine: { color: "E3E7EF", size: 0.5 }, catGridLine: { style: "none" },
  showTitle: true, title: "Predicted score (0-100) by chronotype", titleFontSize: 12 });
s.addNotes("All three chronotypes improve: productivity roughly +7 to +11, wellbeing roughly +13 to +14.");

// 9 Ablation
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Results" });
title(s, "Ablation: sleep and scheduling reinforce each other");
s.addImage({ path: "assets/ablation.png", x: 0.55, y: 1.2, w: 5.6, h: 2.52, altText: "Ablation chart" });
const A = R.ablation;
txt(s, [
  { text: `Better sleep alone: wellbeing ${f1(A["Original day"][1])} to ${f1(A["+ Better sleep (7.75 h, regular)"][1])}`, options: { bullet: true, breakLine: true } },
  { text: `Schedule alone: productivity ${f1(A["Original day"][0])} to ${f1(A["+ Optimized schedule only"][0])}`, options: { bullet: true, breakLine: true } },
  { text: `Both together: ${f1(A["Full redesign"][0])} and ${f1(A["Full redesign"][1])}`, options: { bullet: true, bold: true } }],
  { x: 6.4, y: 1.4, w: 3.1, h: 2.6, fontSize: 13, paraSpaceAfter: 8 });
s.addNotes("The ablation shows each change contributes and the full redesign is best.");

// 10 Implementation
pres.addSection({ title: "Wrap-up" });
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Wrap-up" });
title(s, "Implementation");
[["Python 3", "pandas, NumPy, scikit-learn"], ["Streamlit app", "editable task table, before/after timeline, explanations"],
 ["Reproducible", "run_experiment.py regenerates every figure"], ["Files", "engine.py, app.py, README, requirements"]].forEach((c, i) => {
  const x = 0.55 + (i % 2) * 4.55, y = 1.3 + Math.floor(i / 2) * 1.7;
  card(s, x, y, 4.35, 1.5, `Tech card ${i + 1}`);
  txt(s, c[0], { x: x + 0.25, y: y + 0.2, w: 3.9, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
  txt(s, c[1], { x: x + 0.25, y: y + 0.7, w: 3.9, h: 0.7, fontSize: 13 });
});
s.addNotes("Demo the app here: edit a task, press Redesign my day, show the timeline.");

// 11 Limits & future
s = pres.addSlide({ masterName: "TITLE_ONLY", sectionTitle: "Wrap-up" });
title(s, "Limitations and future scope");
card(s, 0.55, 1.25, 4.35, 3.6, "Limitations card"); card(s, 5.1, 1.25, 4.35, 3.6, "Future card");
txt(s, "Limitations", { x: 0.8, y: 1.4, w: 3.9, h: 0.4, fontSize: 17, bold: true, color: C.accent3 });
txt(s, [{ text: "Training data is simulated", options: { bullet: true, breakLine: true } },
  { text: "Greedy search, one day at a time", options: { bullet: true, breakLine: true } },
  { text: "Generic energy curve; screen time estimated", options: { bullet: true, breakLine: true } },
  { text: "Guidance, not medical advice", options: { bullet: true } }], { x: 0.8, y: 1.9, w: 3.9, h: 2.8, fontSize: 13, paraSpaceAfter: 8 });
txt(s, "Future scope", { x: 5.35, y: 1.4, w: 3.9, h: 0.4, fontSize: 17, bold: true, color: C.accent2 });
txt(s, [{ text: "Train on real, consented user data", options: { bullet: true, breakLine: true } },
  { text: "Global search: ILP, genetic algorithm, RL", options: { bullet: true, breakLine: true } },
  { text: "Personal energy curve from daily ratings", options: { bullet: true, breakLine: true } },
  { text: "Calendar integration and weekly planning", options: { bullet: true } }], { x: 5.35, y: 1.9, w: 3.9, h: 2.8, fontSize: 13, paraSpaceAfter: 8 });
s.addNotes("Be honest about the simulated data; it is the main limitation and the first thing to fix with real data.");

// 12 Conclusion
s = pres.addSlide({ masterName: "DARK", sectionTitle: "Wrap-up" });
title(s, "Plan the day around your energy", true);
txt(s, `Predicted +${f1(dP)} productivity and +${f1(dW)} wellbeing on a typical student day by moving deep work to peak hours, adding exercise, breaks and regular meals, and protecting sleep.`,
  { x: 0.8, y: 3.0, w: 8.4, h: 1.0, fontSize: 16, color: "C9D3E6" });
txt(s, "Thank you  |  Questions?", { x: 0.8, y: 4.4, w: 8.4, h: 0.5, fontSize: 20, bold: true, color: "FFFFFF" });

(async () => {
  await pres.writeFile({ fileName: "AI_Daily_Routine_Redesign.pptx" });
  if (applyTheme) {
    await applyTheme("AI_Daily_Routine_Redesign.pptx", THEME);
  }
  console.log("ok");
})();
