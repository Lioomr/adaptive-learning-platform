# Student Portal — Menna

**Owner:** Menna  
**Document scope:** Student screens ST1–ST21; shared SYS screens as needed.  
**Stage:** Phase 1 simulated UI only.

## Mission
Make the student feel the learning experience is genuinely personalized while using scripted content and mock state. Student screens should be mobile-friendly and bilingual.

## P0 tasks — main demonstration
- [ ] **ST1 Login:** course + instructor + plain-language data-use notice; demo sign-in, returning/first-time variants.
- [ ] **ST2 Consent:** required platform-use box, separate optional research box, privacy link, resume mock state.
- [ ] **ST3 Preferences:** EN/AR interface choice, EN/AR/both question choice; RTL preview.
- [ ] **ST4 Diagnostic:** progress, bilingual questions, "I don't know", next, pause/resume; mock branch for different answers.
- [ ] **ST5 Skill map:** mastery/uncertainty legend, prerequisite concept nodes, challenge-result preview, "Start learning".
- [ ] **ST6 Home:** next-up recommendation and reason, weekly concepts, reviews due, exam readiness placeholder, navigation.
- [ ] **ST7 Course home:** lecture list with available/coming soon/updated statuses and roadmap entry.
- [ ] **ST8 Lesson:** instructor-approved label, summary, terms, source/slide link, format/language/depth controls, tutor entry.
- [ ] **ST9 Practice:** MCQ and hint interactions, mastery indicator and next-question mock behavior.
- [ ] **ST10 Mastery assessment:** non-graded label, reviewed questions, pass versus needs-review ending.
- [ ] **ST11 Diagnosis ladder:** show 2-level prerequisite check, different explanation, worked example/break/ask instructor, summary; avoid endless loops.
- [ ] **ST12 Roadmap:** nested topic→concept visual, current location, prerequisites, practice action.
- [ ] **ST17 Tutor:** persistent chat drawer, scripted bilingual answers, source chips, explain differently, supported/unsupported mock reply.

## P1 screens — after P0 integration
- [ ] ST13 mastery overview and per-concept learning state.
- [ ] ST14 exam readiness with uncertainty labels.
- [ ] ST15 timed mock quiz and results.
- [ ] ST16 daily review, flip/rate card.
- [ ] ST18 settings (language, display preferences, consent **preview**, deletion entry).
- [ ] ST19 post-test, ST20 survey, ST21 end-of-course summary.

## Acceptance tests
- [ ] Complete ST1 → ST2 → ST3 → ST4 → ST5 → ST6 without broken links.
- [ ] A mock wrong answer on Recursion routes to Call Stack check, then back to lesson.
- [ ] A mock correct path shows next available concept; outcomes match instructor/advisor fixtures.
- [ ] Arabic flips navigation and text flow while preserving screen/question.
- [ ] Tutor says “demo response” and citations point to a mock approved source.
- [ ] No graded-student claims or real account/data operations.

## Two-course integration requirements

Follow [DEMO-AGREEMENTS.md](../DEMO-AGREEMENTS.md) and the shared contract. Within existing ST6/ST7, let a student select C-PY or C-MATH; this is an interaction, not a new screen ID. ST4 diagnostics, ST5 maps, ST7–ST12 lessons, questions and remediation use the selected course. Keep mastery independently by student, course and concept; switching courses must not overwrite either course. ST6 shows both course progress values, and ST13–ST21 use the appropriate selected course. All five fictional profiles are shared across portals.

- [ ] Complete a course-specific diagnostic, inspect its prerequisite map and navigate to an appropriate lesson for **each** course.
- [ ] Demonstrate Nour's Recursion → Call Stack diagnosis and Mathematics Derivatives → guided practice; responses and recommendation are scripted.
- [ ] Show baseline Nour as Python 8/10 and Mathematics 8/10, and show the specified 9/10 Python result after stack practice; Advisor and Instructor views agree.
- [ ] Course switching preserves independent progress and session answers; English/Arabic content and RTL/LTR direction remain usable on mobile and desktop.
- [ ] Run the six shared scenarios and reset; report evidence and review through the assigned Linear issue.
