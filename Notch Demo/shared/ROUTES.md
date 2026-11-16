# Routes

Implemented routes and role mappings are centralized in `frontend/lib/routes.ts`: `/demo`, `/student`, `/instructor`, `/advisor`; `/` redirects to `/demo`. The three role views are shared-data previews, not completed portal screens. Developers should add screen routes without changing existing paths or duplicating data state.

Proposed screen routes: `/student/st1`–`/student/st21`, `/instructor/in1`–`/instructor/in19`, `/advisor/ad1`–`/advisor/ad6`, `/shared/sys1`–`/shared/sys3`. SYS1–SYS3 are tracked separately in MAH-29. Verify exact flow against the unavailable original journey before implementation.
