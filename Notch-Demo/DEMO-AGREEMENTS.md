# Phase 1 demo agreement

This agreement coordinates the Phase 1 scope. The original journey PDF and visual specification were not available in the repository or connected primary Drive search; review the [screen inventory](SCREEN-MAP.md) against them when supplied. Do not infer exact missing screen details.

One Next.js application is separate from and does not modify Django. Student (Menna) owns ST1–ST21, Instructor (Omar) IN1–IN19, Advisor (Mahmoud) AD1–AD6. Integration Lead owns SYS1–SYS3 and shared integration. The 49 IDs remain in scope; the current foundation is not their implementation. Shared contracts require Integration Lead review. No real authentication, database, machine learning, or external notifications.

Two courses, 20 concepts and 10 fictional students use stable identifiers. The authoritative current fixtures are `frontend/data/fixtures.ts`. The current illustrative bank has two questions, not the required 100; independently review and complete it before assessments are presented as validated. Existing earlier five-student, scripted 8/10 and 9/10 promises are superseded by the score-based model and are not acceptance criteria. The implementation and its gaps are described in [shared contracts](shared/ARCHITECTURE.md).

Mastery is simulated, not validated BKT, DKT or IRT. For each submitted assessment: round the percentage correct to the nearest integer, then round and clamp `0.60 × previous + 0.40 × score` to 0–100. Unanswered items count as incorrect; repeated submissions are separate attempts. Thresholds: 0–39 Needs Support, 40–69 Developing, 70–84 Proficient, 85–100 Mastered. Prerequisites are ready at 70 or above; recommendations point to the first prerequisite below 70. Eligibility currently advises rather than blocks assessment.

Local state is a browser-only demonstration and does not synchronize across browsers or devices. No production deployment or merge without Integration Lead approval. Portal screens begin after the shared foundation is reviewed.
