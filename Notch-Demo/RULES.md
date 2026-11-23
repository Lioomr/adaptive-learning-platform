# Shared development rules — Notch-Demo

## 1. Scope
Phase 1 is **UI-first**. Do not implement a real database, Django API integration, model inference, retrieval engine, BKT/DKT/IRT, or live learning analytics for the demo. A visually realistic interface and controlled interactions are sufficient. Revisit these decisions in later phases.

## 2. Source-of-truth
- All developers must follow [DEMO-AGREEMENTS.md](DEMO-AGREEMENTS.md), the shared Phase 1 coordination agreement, subject to the original journey and approved visual system.
- Follow the original **ST / IN / AD / SYS** screen IDs and descriptions in Full_User_Journey_Scenarios_enhanced(1).pdf.
- Use the Notch brand guidelines and the shared portal design tokens for interface styling.
- Do not invent a new requirement without documenting it as a proposal. Some flows may be visually grouped but their original IDs must remain traceable.

## 3. Visual system (approved)
- Use the Notch signature artwork supplied in `frontend/public/brand/`. Use the horizontal lockup at 96 CSS px or wider and the compact symbol on the collapsed rail.
- Apply the semantic roles from `frontend/app/notch-tokens.css`. Light mode uses a chalk canvas, white panels and violet actions. Dark mode uses ink, elevated purple panels and lavender actions.
- Success, review, error and information use separate semantic roles in both themes. Pair status colors with text or an icon.
- Use Inter for English, IBM Plex Sans Arabic for Arabic and STIX Two Math for typeset notation. Keep Arabic tracking at zero and preserve the direction of equations and brand artwork.
- Use 12px control radii, 16px cards and 24px feature panels. The shell uses 20px, 32px and 48px outer margins by viewport size.
- Use clear, supportive language: "Needs review", not blaming or diagnosing a student.
- Support Arabic RTL, English LTR, keyboard focus, labels, contrast, and responsive layouts.
- Student should also work on mobile; instructor/advisor should work on laptop.

## 4. Frontend boundaries
- Do not change existing repository backend files for this task.
- Use the shared Next.js App Router application in `frontend/`.
- Reuse components: AppShell, Sidebar, Header, Card, Status, Progress, QuestionCard, ConceptNode, Modal, TutorDrawer.
- Keep portal-specific views and styles inside their owners' areas; reusable UI and mock contracts are shared and reviewed.
- All interface pages should use structured mock service functions, not embed contradictory data in JSX/HTML.
- Navigation should use stable routes named after the corresponding screen IDs in the task specs.

## 5. Simulation and truthfulness
- Use deterministic preset stories for demo: a student who masters the concept, one needing prerequisites, and a student with low activity.
- State changing clicks must update visible mock state consistently: when Nour completes a question, her skill map and instructor view must display compatible outcomes.
- Label mastery predictions, AI responses, risk alerts and imports as **Demo / Simulated**.
- Do not claim a real upload was processed, email sent, student graded, data deleted, or analytics calculated if only a UI state changes.
- Never store real names, grades, conversations, credentials, or personal student data in mock fixtures.

## 6. Collaboration
- Menna owns Student screens; Omar owns Instructor; Mahmoud owns Advisor.
- Propose shared component changes in a PR and coordinate before altering a common contract.
- Use short-lived branches from latest main, e.g. `student/<linear-id>-dashboard`, and request Integration Lead review before merging.
- Each change needs a short PR summary, affected screen IDs, screenshot or video, and manual test notes.
- Avoid editing another owner's portal without review.
- Use one integrated scenario and consistent data; a separate portal is not done until its links and states match the other portals.
- All portals use the same shared two-course fixtures. Do not independently invent conflicting courses, fictional student profiles, or mastery values. Coordinate every shared-data contract change and review changes affecting another portal with its developer.
- Test all shared integration scenarios in DEMO-AGREEMENTS.md before the demo is complete.

## 7. Done means
- Matches PDF screen behavior and approved design system.
- Has navigation/back/empty/error states as appropriate.
- Shows meaningful user actions (no misleading dead-end buttons).
- Works in EN and AR where visible; mirrored layout in RTL.
- Responsive and keyboard navigable.
- Mock/demo state is clearly marked and no backend dependency is required.

## 8. Linear Task Management and Submission Policy

1. Every developer must work from an assigned Linear issue; every implementation task must have a corresponding issue.
2. Move the issue from **Todo** (or **Backlog**) to **In Progress** when starting work. Record blockers and dependencies in the issue.
3. Submit all work through its assigned Linear issue. Each submission must include:
   - A GitHub branch or pull request link.
   - Screenshots or a short demo video.
   - The completed screen IDs and functionality.
   - Testing notes.
   - Known issues or unfinished requirements.
4. Move the issue to **In Review** when the evidence is ready. Do not mark it **Done** simply because code was written. Completion requires that the deliverables meet the acceptance criteria and have been reviewed.
5. If changes are requested, update the same issue with the revised work and evidence, and use **In Progress** and **In Review** to reflect its state.
6. GitHub is the source of code and documentation; Linear is the source of task ownership, progress, submission evidence, and review status. A submission may link a PR or commit.

## 9. GitHub identities and branches

- Use only approved human contributor identities. The Integration Lead is the GitHub identity explicitly confirmed by the project owner; the portal owners are Menna (Student), Omar (Instructor), and Mahmoud (Advisor). Confirm exact developer usernames before creating a branch attributed to them.
- Do not list AI tools as contributors, co-authors, reviewers, or project team members, and do not include AI co-author trailers. Do not fabricate a human identity.
- Branch names must use only approved human identifiers; do not include names of AI tools or agents. Use short-lived task-specific branches and the existing issue workflow.
- PR #3's existing branch predates this rule. Prepare a compliant replacement only under the confirmed Integration Lead identity, and obtain Integration Lead approval before switching branches or closing the original PR.
