# Foundation UI evidence (2026-11-16)

Screenshots of the shared foundation before and after the UI redesign, captured with headless Chrome 
(DevTools Protocol, device-metrics emulation at the stated width, fresh browser profile). "Before" images were captured from commit `40ec927` and "after" and journey images from the production build (`next build` + `next start`).

- `before-*` / `after-*`: full-page captures per route and width (1440, 1280, 768, 390, 375).
- `journey-*`: the shared integration journey (Nour, Recursion 35% → 61%, Instructor and Advisor views, reset confirmation, mobile drawer, guided tour).

Full-page captures render beyond the viewport, so the fixed sidebar appears only one viewport tall at the top-left; in a browser it stays fixed for the full height.

The checks behind these images are listed in [INTEGRATION-TESTS.md](../../INTEGRATION-TESTS.md).
