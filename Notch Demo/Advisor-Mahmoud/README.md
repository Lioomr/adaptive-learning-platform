# Academic Advisor Portal — AD1–AD6

Phase 1 implementation for MAH-20 and MAH-23–27, coordinated by MAH-6. This is part of the existing Next.js application, not a second application. All people, progress and actions are fictional simulations.

## Run on a Mac in VS Code

1. Open the repository folder in VS Code, then choose **Terminal → New Terminal**.
2. Select Node 24 (the available, tested version is 24.21.0). With nvm:

   ```sh
   nvm use 24
   ```

   If it is not installed: `nvm install 24`. The test runner needs Node 22.18 or later; Node 20 cannot run the TypeScript unit-test command.
3. From this workspace:

   ```sh
   cd "/Users/mahmoudusama/Desktop/advisor portal/Notch Demo/frontend"
   npm ci
   npm run dev
   ```

4. Open **http://localhost:3000/advisor/ad2**. Check the terminal URL if port 3000 was occupied; Next may choose another port in development.

There is no backend to start, database to migrate, environment file to create, or login account to configure. Do not add real student details or credentials. The shared portal switcher is a presenter preview tool, not authentication.

For a production build locally:

```sh
npm run build
npm run start -- --hostname 127.0.0.1
```

Open **http://127.0.0.1:3000/advisor/ad2**. Stop a running server with **Control+C** before starting another on the same port.

## Review every screen

| Ticket | Screen / path | Review flow |
| --- | --- | --- |
| MAH-20 | AD1 `/advisor/ad1` | Read role/privacy limits and the ten fictional assignments; acknowledge the simulation, then open the caseload. The acknowledgement is not legal consent. |
| MAH-23 | AD2 `/advisor/ad2` | Search English or Arabic names; filter by course, inactivity, support opportunities or limited evidence; try an unmatched search and clear filters; open Nour. |
| MAH-25 | AD3 `/advisor/ad3` | Compare both course averages; expand skill nodes; follow diagnosis rationale to its prerequisite; inspect warnings, recorded attempts and nudge history. |
| MAH-24 | AD4 `/advisor/ad4` | Choose a recipient, course, template and message language. Edit, preview, cancel or confirm a simulated send. Inspect history. Editing a template prompts before replacing your draft. |
| MAH-26 | AD5 `/advisor/ad5` | Select Youssef to inspect the frozen 14-day inactivity rule. Every warning includes its reason, data limit and a suggested intervention. Open a student or prepare a nudge. |
| MAH-27 | AD6 `/advisor/ad6` | Review both prerequisite graphs as an ordered roadmap, the 70% readiness rule and the suggested next course focus. Return to the student or prepare a nudge. |

Use **العربية** / **English** to switch advisor content and shared chrome. Layout direction mirrors; message language is selected separately. Use the shared student selector to change the student in focus. Links with `?student=S-NOUR` may be bookmarked; unknown/unassigned IDs show an unavailable state.

### Shared-state demonstration

1. Choose Nour and Python in the shared controls. Switch to Student and answer **A base case**. Submit: Recursion changes from 35% to 61% under the shared 60/40 formula.
2. Switch to Instructor, then Advisor → Nour. The same Recursion value appears; Call Stack remains 55%. Readiness still points to Call Stack below 70%.
3. Select Mathematics, switch to Student, and submit **3** twice (use **Start a new attempt** between submissions). Derivatives changes 45% → 27% → 16%.
4. In Advisor → Early warning → Nour, inspect repeated prerequisite difficulty and declining progress. These require the two recorded attempts; baseline snapshots do not invent a trend.
5. In Demo Control Center, choose **Reset demo** and confirm. Mastery returns to baseline and nudge history clears.

## Data and architecture

- `components/`: owner-scoped views, locale and CSS module using the approved shared tokens.
- `services/`: deterministic warning/diagnosis and nudge validation; EN/AR names and templates.
- `frontend/app/advisor/`: thin route and layout adapters.
- Shared fixtures, permissions, mastery, assessment history and reset remain authoritative. No independent student/mastery copies.
- The nudge action is an advisor-only addition to `useDemo`. It validates the recipient, enrollment, language and nonblank message (maximum 1,000 characters); identical retries are idempotent. It never makes a delivery request or changes mastery/activity evidence.
- Nudge history is explicitly **session-only**, shared across client navigation, cleared by full reload or Demo Control Center reset. Persisted schema v2 remains unchanged.
- `ShellCopyContext` is opt-in: advisor Arabic labels and direction only. Student, Instructor and Demo retain their existing defaults.
- Turbopack's root includes the owner directory. Tailwind processes `globals.css`; owner CSS modules use native CSS module compilation.

## Checks

From `Notch Demo/frontend` with Node 24:

```sh
npm run lint
npm run lint:advisor
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:advisor
```

Browser tests start the production server on port 3000 (or reuse an existing one). Build first and stop unrelated servers on that port. The tests capture screenshots in `../Advisor-Mahmoud/evidence`; temporary traces and failures stay in ignored `test-results/advisor`.

## Boundaries and source limitations

- The approved agreement supersedes old five-student and scripted 8/10 → 9/10 examples. All ten students and numeric shared mastery are used.
- Original journey PDF and original visual-system source are not present in this checkout, as recorded in `DEMO-AGREEMENTS.md`. Implementation follows the complete Linear descriptions, TASKS.md, SCREEN-MAP.md, RULES.md tokens and shared foundation contracts; exact comparison to those unavailable originals is not claimed.
- The shared bank still has two illustrative questions (MAH-28); Student/Instructor full screen implementations are separate work. Advisor diagnosis uses shared prerequisite rules and actual recorded attempts; it does not claim unavailable private diagnosis transcripts.
- The approved catalog has only Python and Mathematics. Planning suggests the next focus within these course graphs; it does not invent additional courses, enrollment, predictive outcomes or outside grades.
- Client-side role and caseload checks demonstrate visibility; they are not production authentication.
- Submission belongs in **In Review** until Integration Lead acceptance. No merge or deployment is performed by this task.

## Troubleshooting

- **`node: bad option` or TypeScript test errors:** run `nvm use 24`, then retry.
- **Missing modules:** run `npm ci` inside `Notch Demo/frontend`, not in the owner directory.
- **Browser executable missing:** run `npx playwright install chromium`.
- **Port 3000 occupied:** stop the other terminal with Control+C, or use `npm run dev -- --port 3001` and open the URL printed in that terminal. The browser tests expect port 3000.
- **Old mastery values:** use the Demo Control Center reset. Browser storage is local to this browser; corrupt stored demo data is validated and reset by the existing foundation.
- **Nudge history disappeared:** full reload deliberately clears session-only nudge history; it was never sent or saved to a server.
