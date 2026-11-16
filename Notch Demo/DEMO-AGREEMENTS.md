# Phase 1 demo agreement — two courses

This is the coordination source of truth for the Phase 1 demo. The agreed journey PDF and approved design system remain authoritative for journey and visual details. They were unavailable when this agreement was written: flag discrepancies for team review; do not silently change a journey. The curriculum, fixtures, examples, thresholds and frontend architecture below are **proposed demo details**, not claims about the missing references or production decisions.

## Scope and responsibilities

Build a high-fidelity, interactive frontend-only simulation with Student (Menna), Instructor (Omar), and Academic Advisor (Mahmoud) portals. Both Introduction to Python (`C-PY`) and Mathematics (`C-MATH`) appear consistently. Preserve ST1–ST21, IN1–IN19, AD1–AD6 and SYS1–SYS3: 49 existing IDs. No production backend, database, live AI, real notifications, real authentication or student data. Clearly mark simulated assessment, mastery, tutor, upload and warning outcomes. The [screen map](SCREEN-MAP.md) controls P0/P1 ordering; the [rules](RULES.md) and [contract](MOCK-DATA-CONTRACT.md) apply.

## Course identities and graph

Proposed fictional instructors: `I-PY` Dr. Lina Hassan teaches C-PY; `I-MATH` Dr. Adam Nabil teaches C-MATH. A simulated instructor sees only assigned courses; a demo role switch can select either identity. Advisor sees assigned students across both courses, without private tutor transcripts or content-approval privileges. Names and all data are synthetic.

The graph edges below are prerequisites, not a claim of an approved curriculum. A concept may have multiple prerequisites; a locked or needs-review state is explicit and no unlisted edge is implied. Baseline mastery states refer to Nour only. `M` = mastered, `R` = needs review, `N` = not ready. “Practice” means scripted practice and its predeclared outcome, never an inferred AI prediction.

### Introduction to Python — proposed teaching fixtures

| ID · English / Arabic | Description and objective | Prerequisites | Lesson example | Assessment → answer and explanation | Nour | Remediation |
|---|---|---|---|---|---|---|
| PY-VAR Variables / المتغيرات | Bind a value to a name and read it. | None | `x = 3` stores 3 in x. | After `x = 3`, x? → 3; assignment binds the value. | M | Trace name/value cards. |
| PY-TYPE Data Types / أنواع البيانات | Recognize numeric, string and Boolean values. | PY-VAR | Compare `3` and `"3"`. | Type of `"3"`? → string; quotes denote text. | M | Sort example values by type. |
| PY-OP Operators / المعاملات | Evaluate arithmetic and comparison expressions. | PY-VAR, PY-TYPE | Evaluate `2 + 3 * 2`. | Result? → 8; multiplication precedes addition. | M | Work through precedence steps. |
| PY-COND Conditions / الشروط | Select a branch using a Boolean condition. | PY-OP | `if x > 0` chooses a branch. | Is `3 > 0` true? → yes; 3 is greater than 0. | M | Trace both branches using values. |
| PY-LOOP Loops / الحلقات | Repeat an operation over a range. | PY-COND | `for i in range(3)` visits 0, 1, 2. | How many iterations? → 3; range contains three values. | M | Trace an iteration table. |
| PY-FUNC Functions / الدوال | Define and call a reusable function with arguments. | PY-VAR, PY-OP | `def double(x): return 2*x`. | `double(3)`? → 6; substitute 3 for x. | M | Trace parameters and return values. |
| PY-LIST Lists / القوائم | Index ordered collections. | PY-VAR, PY-LOOP | `a = [4, 7]`; `a[0]` is 4. | `a[1]`? → 7; indices begin at zero. | M | Practice indexing with cards. |
| PY-DICT Dictionaries / القواميس | Look up values by key. | PY-VAR, PY-TYPE | `d = {'a': 2}`. | `d['a']`? → 2; key a maps to 2. | M | Match keys to values. |
| PY-STACK Call Stack / مكدس الاستدعاءات | Trace nested function calls and returns. | PY-FUNC | `f` calls `g`, then `g` returns. | Which returns first? → g; the most recent call finishes first. | R | Draw frames and trace a nested call. |
| PY-REC Recursion / الاستدعاء الذاتي | Trace a base case and recursive call. | PY-COND, PY-FUNC, PY-STACK | `count(n)` calls `count(n-1)` until zero. | Why stop at zero? → base case prevents further calls. | N | Review PY-STACK then trace base case. |

### Mathematics — proposed teaching fixtures

| ID · English / Arabic | Description and objective | Prerequisites | Lesson example | Assessment → answer and explanation | Nour | Remediation |
|---|---|---|---|---|---|---|
| MA-ARITH Arithmetic Foundations / أساسيات الحساب | Compute with fractions and signed numbers. | None | `1/2 + 1/4 = 3/4`. | `-2 + 5`? → 3; move five units from -2. | M | Use a number line. |
| MA-EXPR Algebraic Expressions / التعابير الجبرية | Simplify like terms. | MA-ARITH | `2x + 3x = 5x`. | `x + 2x`? → 3x; add coefficients. | M | Group like terms visually. |
| MA-LIN Linear Equations / المعادلات الخطية | Solve a one-variable equation. | MA-EXPR | `x + 2 = 5` gives x = 3. | `2x = 8`? → 4; divide both sides by 2. | M | Balance equation steps. |
| MA-INEQ Inequalities / المتباينات | Solve and interpret inequalities. | MA-LIN | `x + 1 > 3` gives x > 2. | `-x > -2`? → x < 2; reverse when dividing by a negative. | M | Practice sign reversal on a number line. |
| MA-FUNC Functions / الدوال | Evaluate a function at an input. | MA-LIN | `f(x) = 2x + 1`. | `f(2)`? → 5; substitute 2. | M | Use input/output tables. |
| MA-GRAPH Graphs / الرسوم البيانية | Read points and slope from a linear graph. | MA-FUNC | `y = 2x + 1` crosses y-axis at 1. | Slope? → 2; coefficient of x. | M | Plot a small input/output table. |
| MA-QUAD Quadratic Equations / المعادلات التربيعية | Solve a simple factorable quadratic. | MA-EXPR, MA-LIN | `(x-1)(x+1) = 0`. | Roots? → 1 and -1; either factor can be zero. | M | Review factoring and zero-product rule. |
| MA-LIMIT Limits / النهايات | Evaluate a simple limit by substitution. | MA-FUNC, MA-GRAPH | As x approaches 2, `x+1` approaches 3. | Limit of `2x` as x → 3? → 6; substitute for this continuous function. | M | Use a table of approaching values. |
| MA-DERIV Derivatives / المشتقات | Find a simple derivative as a rate of change. | MA-LIMIT, MA-FUNC | Derivative of `x²` is `2x`. | Derivative of `x²` at x=3? → 6; evaluate 2x at 3. | R | Review limits and slope, then guided derivative practice. |
| MA-APP Applications of Derivatives / تطبيقات المشتقات | Interpret a derivative in context. | MA-DERIV, MA-GRAPH | Interpret slope as instantaneous velocity. | If position is `t²`, velocity at t=2? → 4; derivative is 2t. | N | Review derivative and units. |

## Shared students and deterministic baseline

All five fictional students are enrolled in both courses and assigned to advisor `A-01` (fictional). The default baseline is resettable. Each course has ten concepts. Course progress is **mastered concepts / 10**, displayed as a fraction and percentage; `R` and `N` do not count. Concept states are defined by the baseline below; unspecified concepts are `N`. A preset assessment result is an event, not evidence of a real evaluation. All timestamps are relative to the fixed demo clock (`2026-01-15 12:00 UTC`); they are not real student activity.

| Student | Baseline concepts mastered (all others N except listed R) | Simulated activity, result and intervention |
|---|---|---|
| S-NOUR Nour | Python: PY-VAR, PY-TYPE, PY-OP, PY-COND, PY-LOOP, PY-FUNC, PY-LIST, PY-DICT (8/10); PY-STACK R, PY-REC N. Math: MA-ARITH, MA-EXPR, MA-LIN, MA-INEQ, MA-FUNC, MA-GRAPH, MA-QUAD, MA-LIMIT (8/10); MA-DERIV R, MA-APP N. | Active one day ago; scripted Recursion check 1/3, Call Stack check 1/2; review stack frames. Math derivative check 1/3; guided derivative practice. |
| S-AHMED Ahmed | Python: PY-VAR, PY-TYPE, PY-OP, PY-COND (4/10); PY-LOOP and PY-FUNC R. Math: first nine concepts through MA-DERIV (9/10); MA-APP N. | Active two days ago; loops 1/3 and functions 1/3; iteration table and parameter tracing. |
| S-SALMA Salma | Python: PY-VAR, PY-TYPE, PY-OP, PY-COND, PY-LOOP (5/10); PY-FUNC R. Math: MA-ARITH, MA-EXPR, MA-LIN, MA-INEQ, MA-FUNC (5/10); MA-GRAPH R. | Active daily for five demo days; both checks 2/3; short practice in functions and graphs. |
| S-YOUSSEF Youssef | Python: PY-VAR, PY-TYPE, PY-OP, PY-COND, PY-LOOP, PY-FUNC, PY-LIST (7/10); PY-STACK R. Math: MA-ARITH, MA-EXPR, MA-LIN, MA-INEQ, MA-FUNC, MA-GRAPH, MA-QUAD (7/10); MA-LIMIT R. | Last active 14 demo days ago; previous checks 3/3 on PY-LIST and MA-QUAD; simulated inactivity warning and optional nudge preview. |
| S-MARIAM Mariam | Python: PY-VAR (1/10); PY-TYPE and PY-OP R. Math: MA-ARITH (1/10); MA-EXPR and MA-LIN R. | Active three days ago; both foundation checks 1/3; review data types and algebraic terms. |

Math “first nine” means MA-ARITH, MA-EXPR, MA-LIN, MA-INEQ, MA-FUNC, MA-GRAPH, MA-QUAD, MA-LIMIT and MA-DERIV. Inactivity is a transparent demo rule: last activity at least 14 days before demo clock. A warning is not a clinical or AI judgment. Results, timestamps and recommended interventions are scripted; confidence and sample-size limits must be visible.

## Six integrated scenarios

Every scenario starts from the baseline above unless stated otherwise. Each event is written once to shared in-browser state and projected into the authorized views. Reset restores the baseline and clears scenario events, simulated messages and UI session progress. No network action occurs.

| Scenario | Initial → action → simulated response | Student portal | Instructor portal | Advisor portal | Final state |
|---|---|---|---|---|---|
| Successful learning | Salma PY-FUNC R, Python 5/10 → completes scripted function practice and passes 3/3 → mark PY-FUNC M. | Success, map and Python progress update. | I-PY sees practice and 6/10. | Sees Python 6/10, math 5/10. | PY-FUNC M; Python 6/10. |
| Prerequisite diagnosis | Nour PY-REC N, PY-STACK R, Python 8/10 → fails scripted Recursion check 1/3 → check stack 1/2 and recommend stack lesson. | Diagnosis and next action link to PY-STACK. | I-PY sees attempts and stack roadblock. | Sees Python 8/10 and support recommendation, no tutor transcript. | States unchanged; diagnosis open. |
| Repeated difficulty | Ahmed PY-LOOP R, Python 4/10 → second scripted loop check 1/3 → repeated-difficulty flag. | Needs-review feedback and iteration-table recommendation. | I-PY sees both attempts and intervention suggestion. | Sees explainable learning-difficulty summary. | PY-LOOP R, 4/10; flag active. |
| Mathematics remediation | Nour MA-DERIV R, math 8/10 → derivative check 1/3 → recommend guided derivatives and limit review. | Feedback, relevant math map and lesson link. | I-MATH sees attempt and concept difficulty. | Sees math 8/10 and support action. | MA-DERIV R, 8/10. |
| Inactivity and warning | Youssef inactive 14 days, both courses 7/10 → advisor opens warning and previews a nudge → simulated log entry only. | Progress unchanged; no real message arrives. | Assigned instructor sees inactivity indicator for their course. | Shows reason, data limit and simulated nudge history. | Progress unchanged; preview logged. |
| Improvement after practice | Start from the prerequisite-diagnosis scenario, not a fresh baseline: Nour PY-STACK R → completes guided stack practice and passes scripted 2/2 → mark stack M; Recursion remains N until its next scripted learning action changes it. | Map shows PY-STACK M, Python 9/10 and next Recursion action. | I-PY sees practice and 9/10. | Sees Python 9/10 and updated support status. | PY-STACK M, PY-REC N, 9/10; reset returns to baseline. |

## Proposed architecture and UI

Proposed stack, subject to team agreement: Next.js App Router, React, TypeScript, Tailwind CSS, shared reusable components, Zustand **or** React Context (choose one before implementation), local JSON/TypeScript fixtures, Vercel deployment, GitHub and Linear. No framework has been approved by this document. Recommend a separate `frontend/` directory beside Django, with `app/` routes, `components/shared/`, `components/{student,instructor,advisor}/`, `fixtures/`, `services/mock/`, `state/`, and `types/`. Shared components and contracts require review by all affected owners. Mock services alone read/write shared demo state; views do not duplicate fixtures. Local state is resettable and persists for the demo session, not a production data store.

Proposed routes: `/student/st1` … `/student/st21`, `/instructor/in1` … `/instructor/in19`, `/advisor/ad1` … `/advisor/ad6`, and `/shared/sys1` … `/shared/sys3`. Route names are implementation proposals; course selection is an interaction within existing ST6/ST7 and IN screens, not a new screen ID. Course and simulated role context must be preserved during navigation and validated against enrollment or assignment.

Use the design tokens, typography, accessibility, responsive and bilingual/RTL rules in [RULES.md](RULES.md). The unavailable full design system remains authoritative; resolve any discrepancy rather than inventing visual requirements. Mark simulated AI responses and source references, and use approved mock sources only.

## Collaboration, Linear and acceptance

All implementation is tracked and submitted through assigned issues in the [Linear project](https://linear.app/adaptive-learning/project/notch-demo-phase-1-ui-prototype-0e80fac4810c). Record blockers and dependencies; move Todo → In Progress → In Review → Done only after evidence, acceptance and review. Submission includes PR or commit link, screenshots or video, completed screen IDs and functionality, testing notes and known gaps. Requested changes remain on the same issue. Coordinate changes to shared components/contract and review cross-portal changes with affected owners. GitHub holds code and documentation; Linear holds ownership, progress, evidence and review.

Acceptance requires both courses and all six scenarios to work consistently across authorized portals, reset correctly, use the same counts and events, preserve all 49 IDs, and support English/Arabic and RTL/LTR with responsive and keyboard-accessible interactions. Test role boundaries, privacy, empty/error states, navigation and simulation labels. No real upload, notification, authentication, AI, or persistence to a backend. Owners review the integrated demo together. See [portal tasks](README.md) and [mock contract](MOCK-DATA-CONTRACT.md).
