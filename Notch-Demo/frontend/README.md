# Notch-Demo frontend

Shared Next.js application for the Notch Phase 1 demo. Everything is fictional and simulated; see [shared architecture](../shared/ARCHITECTURE.md) and the [demo agreement](../DEMO-AGREEMENTS.md).

Requires Node 22.18 or later (for `npm test`).

```
npm ci
npm run dev        # http://localhost:3000 → /demo
npm run lint
npm run typecheck
npm test           # assessment, permission and persistence rules
npm run build
```

Structure: `app/` routes and portal layouts · `components/` shared UI · `features/<portal>/` portal views · `services/` pure rules · `store/` shared state · `lib/` routes, permissions, utils · `data/` fixtures · `types/` contracts · `tests/` unit tests.

Run lint, typecheck, test and build before requesting review.
