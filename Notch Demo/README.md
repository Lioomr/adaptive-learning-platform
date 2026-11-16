# Notch Demo — Phase 1 UI Prototype

**Project:** AdaptLearn (Adaptive Learning Platform)  
**Repository:** Lioomr/adaptive-learning-platform  
**Stage:** Phase 1 — frontend visual prototype with mock data and simulated user journeys.

## Goal
Build three connected role-based portals that **visually mimic the agreed user journeys**, without waiting for final database, mastery engine, or AI model decisions. The prototype must be honest about simulated outputs.

| Portal | Owner | Journey IDs | Tasks |
| --- | --- | --- | --- |
| Student | Menna | ST1–ST21 | [Student tasks](Student-Menna/TASKS.md) |
| Instructor | Omar | IN1–IN19 | [Instructor tasks](Instructor-Omar/TASKS.md) |
| Academic Advisor | Mahmoud | AD1–AD6 | [Advisor tasks](Advisor-Mahmoud/TASKS.md) |

## Start here
1. Everyone reads [RULES.md](RULES.md), [SCREEN-MAP.md](SCREEN-MAP.md), and [MOCK-DATA-CONTRACT.md](MOCK-DATA-CONTRACT.md).
2. Each owner implements the first priority screens from their own TASKS.md. The rest remain documented for later phases.
3. Agree on and build a common application shell before splitting into individual pages.
4. Use *one consistent mock dataset*: Nour's course progress must agree across all portals.
5. Review mobile and desktop screens, Arabic/English layout and the handoff flow.

## Sources and precedence
1. **Full_User_Journey_Scenarios_enhanced(1).pdf** — authoritative user journeys and screen IDs.
2. **adaptlearn_ui_ux_design_system.md** — authoritative visual system.
3. These coordination documents — Phase 1 scope, responsibilities, and acceptance criteria.
If any apparent conflict exists, flag it for team review rather than silently rewriting the product journey.

## Existing code
The repository already contains a separate Django backend starter and docs/database-schema.md. **Leave that code and its proposed schema unchanged in Phase 1.** Our UI decisions do not approve the database or AI engines.

## Phase 1 exit checklist
- [ ] A viewer can switch between the three portal previews without real authentication.
- [ ] Each priority screen matches the agreed journey and design system.
- [ ] Navigation, forms, and representative state changes work with deterministic mock data.
- [ ] AI tutor, mastery, uploads, risk scores, and recommendations are clearly simulated.
- [ ] Arabic/English basic flows and RTL are demonstrated.
- [ ] No real student information or API keys are committed.
- [ ] All owners have reviewed the integrated demo.
