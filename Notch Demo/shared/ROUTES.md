# Routes

Implemented routes are centralized in `frontend/lib/routes.ts`. `/` redirects to `/demo`.

| Route | Layout role | Preview | Owner of future screens |
|---|---|---|---|
| `/demo` | `demo` | Demo Control Center (presenter tools) | Integration Lead |
| `/student` | `student` | Student foundation preview | Menna (ST1–ST21) |
| `/instructor` | `instructor` | Instructor foundation preview | Omar (IN1–IN19) |
| `/advisor` | `advisor` | Advisor foundation preview | Mahmoud (AD1–AD6) |

Each portal folder has a `layout.tsx` that renders `<AppShell role="…">`. Any nested route (for example `app/student/st6/page.tsx`) automatically inherits the shell **and** the role, so portal screens never pass or derive a role themselves. Each folder also has a `loading.tsx` that renders the matching layout skeleton.

Proposed screen routes: `/student/st1`–`/student/st21`, `/instructor/in1`–`/instructor/in19`, `/advisor/ad1`–`/advisor/ad6`. System screens SYS1–SYS3 (MAH-29) need a route and a shell decision from the Integration Lead; they are not part of a portal role. Verify each flow against the original journey before implementing it. Do not rename existing paths.
