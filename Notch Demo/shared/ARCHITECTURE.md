# Architecture and current status

One Next.js 16 App Router application in `Notch Demo/frontend` (React 19, TypeScript, Tailwind CSS 4, shadcn/ui on Radix primitives, Lucide, Zustand, Recharts; React Flow is installed for later skill-map screens). Django is independent and untouched. There is no database, real authentication, AI model or network API: everything is a client-side, fictional simulation.

The four routes are **shared-foundation previews**, not the 49 portal screens (ST1–ST21, IN1–IN19, AD1–AD6, SYS1–SYS3).

## Layers

| Layer | Location | Responsibility |
|---|---|---|
| Contracts | `types/index.ts` | Course, concept, student, instructor, advisor, question, submission, attempt, error codes |
| Fixtures | `data/fixtures.ts` | Two courses, 20 concepts, 10 fictional students, instructor assignments, advisor caseload, 2 illustrative questions |
| Rules (pure) | `services/mastery.ts`, `services/assessment.ts`, `services/persistence.ts`, `services/insights.ts` | Formula and bands; submission validation and idempotency; persisted-state validation; read-only aggregates and support indicators |
| Permissions | `lib/permissions.ts` | Simulated role → permission matrix, instructor assignment and advisor caseload checks |
| Routes | `lib/routes.ts`, `app/<portal>/layout.tsx` | Portal paths; each portal layout renders `<AppShell role="…">`, which fixes the role |
| State | `store/demo.ts` (data), `store/ui.ts` (sidebar only) | Single shared persisted store; every mutation is an action that takes the acting role |
| Shell | `components/layout/*` | AppShell, Sidebar/rail, MobileNavigation drawer, Topbar, context selectors, PageHeader |
| UI primitives | `components/ui/*` | shadcn/ui-style Button, Card, Badge, Select, Sheet, AlertDialog, RadioGroup, Progress, Label, Skeleton |
| Shared learning UI | `components/learning/*`, `components/feedback/*`, `components/demo/*` | Mastery badge/bar/ring, StatCard, ConceptProgress, RecentAttempts, AssessmentCard, charts, empty/error/loading states, guided tour, reset |
| Portal previews | `features/<portal>/*` | Foundation preview per portal; portal owners add their screens beside these |

Pure rules have no React or browser dependencies and are covered by `npm test` (Node's built-in runner, no extra packages).

See [routes](ROUTES.md), [components](COMPONENTS.md), [data](DATA-CONTRACT.md), [state](EVENTS-AND-STATE.md), [permissions](ROLE-PERMISSIONS.md) and [integration checks](INTEGRATION-TESTS.md).

## Rendering and hydration

All routes are statically prerendered. The shell (sidebar, top bar, page header) renders on the server. Data regions depend on browser storage, so they render layout-matched skeletons until the store has read `localStorage`; `useHydrated()` returns the server snapshot during React hydration, so server and client markup always match. Fonts are self-hosted at build time through `next/font` (Inter; IBM Plex Sans Arabic) with system fallbacks.

## Dependencies and advisories (reviewed 2026-11-16)

Added for shadcn/ui: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`. `components.json` lets developers add further shadcn components with the CLI.

`npm audit` previously reported 7 moderate advisories. All came from one root: `minimatch` 10.2.6 (GHSA-g3hv-75wg-m249, ReDoS-style "globparts amplification", affected `>=7.0.0 <11.0.1`) nested under `@typescript-eslint/typescript-estree`; the other six entries were the `typescript-eslint` packages that depend on it. Impact: development tooling only (ESLint parser), never shipped to the browser. No compatible fix existed: the latest `typescript-eslint` (8.72.2) still requires `minimatch ^10.2.2` and no patched 10.x exists, so `npm audit fix` could not resolve it, and `--force` was not used.

Applied fix: a scoped `overrides` entry in `package.json` pins only typescript-estree's `minimatch` to `^11.0.1` (resolved 11.0.8). typescript-estree uses minimatch in one place (`allowDefaultProject` glob matching, not used by this config) through the named `minimatch` export, which v11 keeps. Verified: `npm audit` reports 0 vulnerabilities and `npm run lint` passes. Remove the override once `typescript-eslint` depends on a patched minimatch.

## Pending (tracked separately)

- MAH-28: independently reviewed 100-question bank (currently 2 illustrative questions).
- MAH-29: shared system screens SYS1–SYS3.
- MAH-30: scenario presets, full portal tours, optional AI fallback, polish and release readiness.
- Arabic translations and a language switch. Layouts use logical (start/end) properties and the Arabic font is loaded, but RTL has not been exercised with real Arabic content.
- The original journey PDF and design-system document are not in the repository. Tokens follow RULES.md §3; provisional choices are listed in [components](COMPONENTS.md).
