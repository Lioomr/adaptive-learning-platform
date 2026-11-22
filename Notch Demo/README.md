# Notch Demo — Phase 1 UI Prototype

**Project:** Notch (Adaptive Learning Platform)<br>
**Repository:** Lioomr/adaptive-learning-platform  
**Stage:** Phase 1 — frontend visual prototype with mock data and simulated user journeys.

The [demo agreement](DEMO-AGREEMENTS.md) is the Phase 1 coordination source of truth. Both Introduction to Python and Mathematics use shared fictional students and synchronized mock outcomes across the three portals. The selected frontend stack and role access are documented there; the existing Django backend remains separate.

## Goal
Build three connected role-based portals that **visually mimic the agreed user journeys**, without waiting for final database, mastery engine, or AI model decisions. The prototype must be honest about simulated outputs.

| Portal | Owner | Journey IDs | Tasks |
| --- | --- | --- | --- |
| Student | Menna | ST1–ST21 | [Student tasks](Student-Menna/TASKS.md) |
| Instructor | Omar | IN1–IN19 | [Instructor tasks](Instructor-Omar/TASKS.md) |
| Academic Advisor | Mahmoud | AD1–AD6 | [Advisor tasks](Advisor-Mahmoud/TASKS.md) |

## Linear workflow

Use the [Notch Demo — Phase 1 UI Prototype project](https://linear.app/adaptive-learning/project/notch-demo-phase-1-ui-prototype-0e80fac4810c) to find your assigned portal issues. Every implementation task must have an assigned Linear issue. Move it to **In Progress** when starting, record blockers and dependencies, and submit the branch or PR, screenshots or video, completed screens and functionality, testing notes, and known gaps in that issue. Move it to **In Review** for review; only mark **Done** after acceptance criteria are met and the work is reviewed. Address requested changes in the same issue. See the [mandatory policy](RULES.md#8-linear-task-management-and-submission-policy) for details. GitHub holds the code; Linear tracks ownership, progress, evidence, and review.

## Start here
1. Everyone reads [RULES.md](RULES.md), [SCREEN-MAP.md](SCREEN-MAP.md), and [MOCK-DATA-CONTRACT.md](MOCK-DATA-CONTRACT.md).
2. Each owner implements the P0 screens from their own TASKS.md first, then completes the P1 visual coverage for Phase 1.
3. Agree on and build a common application shell before splitting into individual pages.
4. Use *one consistent two-course mock dataset*: all ten fictional students' course progress must agree across all portals.
5. Review mobile and desktop screens, Arabic/English layout and the handoff flow.

## Sources and precedence
1. **Full_User_Journey_Scenarios_enhanced(1).pdf** — authoritative user journeys and screen IDs.
2. [Notch Brand Guidelines and design kit](https://drive.google.com/drive/folders/1wCfqQ-K9QPmLwK5Cbq9_5BFats_mh7jA) — current visual identity and interface standards.
3. [DEMO-AGREEMENTS.md](DEMO-AGREEMENTS.md) — Phase 1 coordination source of truth, subject to the authoritative references above.
4. Other coordination documents — supporting scope, responsibilities, and acceptance criteria.
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

## Foundation status

The shared foundation provides the application shell, design tokens, shared components, the shared store with validated persistence, simulated role permissions and four foundation previews (`/demo`, `/student`, `/instructor`, `/advisor`). It does not implement the 49 screens. Open gaps are listed in [architecture and gaps](shared/ARCHITECTURE.md). From `frontend`, run `npm ci` and `npm run dev`. Do not start portal implementations until Integration Lead review.
