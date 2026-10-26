# AI-Powered Daily Routine Redesign

**Value Added Course (VAC) — Project Submission**  
**Dhanalakshmi College of Engineering (DCE)**  
**Department of Artificial Intelligence & Data Science**  
**Student:** Periyannan Ratish N (B.Tech AI & Data Science, III Year)

---

## 📌 Project Overview
An energy-aware, machine-learning scheduler that takes a person's day (tasks, durations, fixed commitments, sleep habits) and redesigns it for optimal **Productivity** and **Wellbeing**.

1. **Circadian Energy Profiling**: Models alertness curves for Morning, Neutral, and Night Owl chronotypes.
2. **Predictive ML Models**: Dual Gradient Boosting Regressors ($R^2 \approx 0.76$ for Productivity, $0.75$ for Wellbeing) trained on 3,000 synthetic routine logs.
3. **Constraint-Based Heuristic Optimizer**: Allocates high-focus tasks to peak energy slots, fixes irregular meals, inserts active breaks, and protects 7–9 hours of sleep.
4. **Impact**: Proven average improvement of **+9.1 points Productivity** and **+13.1 points Wellbeing** on student routines.

---

## 🚀 How to Run

### Option 1: 1-Click Launch (Windows)
Double-click [`run_app.bat`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/run_app.bat) to start the Streamlit web dashboard.

### Option 2: Terminal / PowerShell
```powershell
# 1. Install dependencies
python -m pip install -r requirements.txt

# 2. Run the interactive Streamlit app
python -m streamlit run app.py

# 3. Regenerate charts & experiment results (optional)
python run_experiment.py
```

---

## 📁 Project Deliverables

| File / Folder | Description |
|---|---|
| [`app.py`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/app.py) | Full interactive Streamlit user interface |
| [`engine.py`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/engine.py) | Core engine: Synthetic data, Gradient Boosting models, circadian model, optimizer |
| [`run_experiment.py`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/run_experiment.py) | Reproducible experiment pipeline producing numerical results & plots |
| [`AI_Daily_Routine_Redesign_Report.docx`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/AI_Daily_Routine_Redesign_Report.docx) | **Formal Project Report** (Cover page, Architecture, ML Analysis, Ablation, Results) |
| [`AI_Daily_Routine_Redesign.pptx`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/AI_Daily_Routine_Redesign.pptx) | **Presentation Deck** (12 professionally styled slides with notes) |
| [`VIVA_PREPARATION_GUIDE.md`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/VIVA_PREPARATION_GUIDE.md) | **Viva Cheat Sheet** (Elevator pitch, Q&A, Architecture breakdown) |
| [`run_app.bat`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/run_app.bat) | One-click double-clickable Windows launcher |
| [`assets/`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/assets) | High-resolution experiment plots (energy curves, timelines, feature importance, ablation) |
| [`data/`](file:///c:/Users/peri/Downloads/VAC%20project%20in%20DCE/routine-redesign/data) | Synthetic routine dataset CSV (3,000 records) & results JSON |

---

## 📊 Key Results

* **Productivity Predictor**: $R^2 = 0.759$, $MAE = 3.11$ points
* **Wellbeing Predictor**: $R^2 = 0.752$, $MAE = 2.92$ points
* **Ablation Performance**:
  * Baseline (original day): 58.2 Prod / 50.9 Wellbeing
  * + Protected Sleep only: 61.6 Prod / 58.7 Wellbeing
  * + Optimized Schedule only: 63.1 Prod / 58.5 Wellbeing
  * **Full Redesign**: **67.3 Prod / 64.0 Wellbeing**
