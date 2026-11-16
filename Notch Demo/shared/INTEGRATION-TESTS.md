# Acceptance checks

From `frontend` run:

```
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

`npm test` runs `tests/*.test.ts` with Node's built-in test runner (Node ≥ 22.18 for native TypeScript stripping). It covers the formula and bands; Nour 35 → 61; role permissions; student, course, enrollment, selected-context and concept checks; empty, duplicate, unknown and mismatched questions; invalid and unexpected answers; malformed submissions; unanswered questions; idempotent retry, conflicting reuse and separate attempts; invalid stored mastery; and rejection of malformed or inconsistent persisted state.

On each PR record screen IDs, screenshots, responsive and keyboard checks, testing notes and known gaps.

## Shared browser journey

1. Open `/demo`. 2. Select Nour. 3. Select Introduction to Python. 4. Open the Student portal. 5. Answer the Recursion question correctly ("A base case"). 6. Mastery changes 35% → 61% (course average 79% → 82%). 7. Switch to Instructor. 8. Nour's row shows 82%, activity shows "Nour · Recursion 35% → 61%", the focus panel shows Recursion 61%; no assessment control is present. 9. Switch to Advisor. 10. Nour shows Python 82% and the attempt; attempts recorded = 1. 11. Refresh. 12. Values persist. 13. Reset from the Demo Control Center (confirmation dialog). 14. Recursion is 35% and no attempts remain.

Also check: malformed or tampered `localStorage` resets to baseline with a notice; an older schema version resets with a notice; the first Tab reaches "Skip to main content"; focus indicators are visible; the mobile drawer traps focus, closes on Escape and returns focus; no horizontal overflow at 1440, 1280, 768, 390 and 375px; reduced motion stops the shimmer; no hydration or console errors.

These checks do not validate the full 100-question bank or the 49 screens. Before release, complete both-course coverage, all screen behaviour, role restrictions, errors, responsive layout, keyboard and Arabic RTL against the original journey.
