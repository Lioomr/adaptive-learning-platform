# Component contract

Shared components live under `frontend/components`. Portal-specific views live under `frontend/features/<portal>` and in the portal's routes. Changes to shared components or tokens require Integration Lead review.

## Design tokens

The first-edition Notch color roles live in `frontend/app/notch-tokens.css`. Shared Tailwind utilities in `globals.css` bind to these roles. The Appearance control follows the system by default and saves a manual light or dark choice in the browser.

| Utility | Light | Dark | Role |
|---|---|---|---|
| `background` | `#F7F6FB` | `#110C24` | Canvas |
| `card` / `popover` | `#FFFFFF` | `#1B162D` / `#251E38` | Work surface / raised surface |
| `foreground` / `muted-foreground` | `#19152B` / `#635F73` | `#F8F6FC` / `#BBB4CC` | Primary and secondary text |
| `primary` / `primary-foreground` | `#5B36C8` / `#FFFFFF` | `#B79BFF` / `#1A102E` | Filled actions and labels |
| `progress` / `ai` | Action violet / signature violet | Lavender / signature violet | Progress measures and tutoring cues |
| `success`, `warning`, `danger`, `info` | Pine, amber, rose, blue | Mint, gold, pink, pale blue | Feedback. Use the corresponding `*-soft` background and `*-ink` label. |

The sidebar is 260px wide (72px collapsed). The header is 64px high. Content has a 1440px maximum width and outer margins of 20px, 32px from 600px, and 48px from 960px. Fields and buttons use a 12px radius, cards 16px, and prominent panels 24px. `notch-type.css` provides the bilingual type scale and local web fonts.

Breakpoints: `<768px` mobile (top bar + drawer, context strip under the top bar), `768–1023px` tablet (72px icon rail with hover/focus labels), `≥1024px` desktop (260px sidebar, user-collapsible to 72px), `≥1280px` context selectors move into the top bar.

## Layout (`components/layout`)

| Component | Purpose |
|---|---|
| `AppShell` | Skip link, sidebar, top bar, context strip, `<main>`, storage notice; provides the role |
| `RoleProvider` / `useRole()` | Role fixed by the portal layout; read it for every permission check |
| `Sidebar` | Desktop sidebar / tablet rail, collapse toggle |
| `MobileNavigation` | Drawer (Radix Dialog: focus trap, Escape, focus return) |
| `RoleSwitcher` | Portal navigation list with `aria-current` |
| `Topbar`, `ContextStrip` | Breadcrumb, demo badge, context controls |
| `StudentSelector`, `CourseSelector`, `ActiveStudentChip`, `ContextControls` | Role-aware context selection (Student portal shows the student read-only; Advisor lists caseload only) |
| `PageHeader`, `SectionHeading` | Single `<h1>` per page; section `<h2>` |

## Learning and feedback

| Component | Purpose |
|---|---|
| `MasteryBadge`, `MasteryBar`, `MasteryRing`, `MasteryLegend` | Band display; badges carry an icon so meaning is not colour-only |
| `StatCard` | KPI tile |
| `ConceptProgress`, `PrerequisitePath` | Concept list with recommendations; prerequisite readiness |
| `RecentAttempts` | Shared attempt feed (all portals read the same records) |
| `AssessmentCard` | Illustrative assessment; generates one submission ID per attempt; Student role only |
| `BandDistributionChart`, `ConceptAverageChart`, `CourseComparisonChart` | Recharts with a visually hidden data table; animation off |
| `StudentAvatar` | Initials only (no photos) |
| `EmptyState`, `ErrorState` (`role="alert"`), `StorageNotice` | Feedback states |
| `CardSkeleton`, `StatGridSkeleton`, `TableSkeleton`, `*PreviewSkeleton` | Layout-matched shimmer skeletons inside `role="status"`; static under reduced motion; no artificial delays |
| `GuidedTourOverlay` | Non-modal tour: highlights `[data-tour="…"]`, focuses the step heading, Escape exits and returns focus. Portal tours (MAH-30) reuse it with their own steps |
| `ResetDemoButton` | Confirmed reset; renders only where `demo:reset` is allowed |

RULES.md §4 names: `Header` → `Topbar`; `Status` → `MasteryBadge`/`Badge`; `Progress` → `Progress`/`MasteryBar`; `Modal` → `AlertDialog`/`Sheet`; `QuestionCard` → `AssessmentCard` (foundation version). `ConceptNode` (React Flow skill map) and `TutorDrawer` are not built yet and belong to the portal screens.

## Rules for portal developers

- Put screens under your portal route and your feature folder; do not copy the shell.
- Read data with `useDemo` selectors and derived helpers in `services/insights.ts`; never compute mastery in JSX.
- Gate store-dependent UI with `useHydrated()` and show a matching skeleton.
- Call actions with `useRole()`; never hard-code a role.
- Use tokens and shared components; label simulated outputs ("Demo · Simulated").
- Use logical properties (`ms-`, `pe-`, `start-`) so layouts mirror in RTL.
