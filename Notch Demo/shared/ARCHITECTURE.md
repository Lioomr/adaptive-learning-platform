# Architecture and current status

A single Next.js App Router application in `Notch Demo/frontend` uses TypeScript, Tailwind, Zustand and localStorage. Django is independent and untouched. Typed fixtures, route definitions, scoring service and persisted store feed the three role landing previews. The previews are shared-foundation integration scaffolding, not the 49 portal screens.

The store checks simulated role, enrollment, selected context, question validity and idempotency before mutating state. These client-side checks are not security authorization. See [state](EVENTS-AND-STATE.md), [permissions](ROLE-PERMISSIONS.md), [components](COMPONENTS.md) and [integration checks](INTEGRATION-TESTS.md). Package versions are recorded in the frontend lockfile.

Separate follow-up work: independently reviewed 100-question bank (MAH-28), system routes (MAH-29), full scenario presets, guided tours, optional AI fallback, polish and release (MAH-30). Original journey and design documents are missing. Portal owners should review the shared contracts and Integration Lead approval before implementing their screens.
