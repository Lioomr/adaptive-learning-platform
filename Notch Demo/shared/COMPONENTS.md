# Component contract

Shared components live under `frontend/components`. Portal-specific views live under `frontend/features/<portal>` and in the portal's routes. Changes to shared components or tokens require Integration Lead review.

## Design tokens

Defined once in `app/globals.css` (`:root` + Tailwind `@theme inline`); use the Tailwind classes, not hex values.

| Token / class | Value | Use |
|---|---|---|
| `primary`, `brand` | `#1E2B58` | Primary actions, sidebar |
| `brand-2` | `#2D4485` | Active navigation, links, focus ring |
| `progress` | `#0D9488` | Progress fills, Proficient band |
| `ai` | `#7C3AED` | "Simulated" / AI labels only |
| `success` / `warning` / `danger` | `#16A34A` / `#D97706` / `#DC2626` | Mastered / Developing / Needs Support |
| `background` | `#F8FAFC` | Canvas |
| `foreground` | `#0F172A` | Text |
| `muted-foreground` | `#475569` | Secondary text |
| `*-soft` | tints | Badge and alert backgrounds |
| `*-ink` | darker shades | **Provisional**: text on white/soft backgrounds so small text meets 4.5:1 (raw teal on white is 3.7:1) |

Layout constants (RULES.md §3): sidebar 260px, collapsed 72px, header 64px; content max width 1280px; gutters 16/24/32px by breakpoint; 12-column grids at ≥1280px. Radius 12px for cards; shadows are low-contrast. Fonts: Inter (English) and IBM Plex Sans Arabic (Arabic) via `next/font`.

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
