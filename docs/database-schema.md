# Database Schema Draft

Status: proposed pilot design based on the decisions discussed so far. It still needs supervisor and ethics/consent review before data collection or implementation is treated as final.

## Plain-language summary

- The first pilot is for one course.
- Students sign in with a university email and password. Passwords are stored as secure hashes by Django, never as readable text.
- Each student's learning activity is linked to a random internal ID. Instructors can see the student's name and progress in the app; research exports leave names and emails out.
- Each question belongs to one topic.
- Save every answer attempt as right or wrong. Do not record how long the student took.
- Record when a hint is requested and when a learning material is opened.
- Do not start logging learning activity until the student agrees to join. If they later withdraw, stop collecting new activity. The ethics/consent rules must decide what happens to records already collected.

## Proposed entities

| Entity | Important fields | Purpose |
|---|---|---|
| `UserAccount` | `id`, `university_email`, `password_hash`, `display_name`, `role`, `created_at` | Login and platform identity. Use Django's password hashing and account system; never store a plain password. |
| `Course` | `id`, `code`, `title`, `term` | The pilot course. The first release uses one course. |
| `CourseInstructor` | `course_id`, `user_id` | Limits which course's student names and progress an instructor can view. |
| `Learner` | `id` (random UUID), `user_id`, `course_id`, `status`, `created_at` | Connects a student's account to their course activity through an internal ID. |
| `ConsentRecord` | `id`, `learner_id`, `course_id`, `form_version`, `status`, `consented_at`, `withdrawn_at` | Records whether the student agreed to the pilot and whether they later withdrew. |
| `Concept` | `id`, `course_id`, `slug`, `name_en`, `name_ar`, `description_en`, `description_ar` | A topic taught in the course. |
| `ConceptPrerequisite` | `id`, `prerequisite_concept_id`, `dependent_concept_id` | Shows which topic should be understood before another topic. |
| `LearningItem` | `id`, `course_id`, `concept_id`, `item_type`, `content`, `authorship`, `status` | A question or practice item. Each item has exactly one topic. |
| `LearningResource` | `id`, `course_id`, `title`, `source_type`, `source_locator` | A learning material offered to students. |
| `ResourceChunk` | `id`, `resource_id`, `chunk_key`, `text`, `source_locator` | A named section of a learning material, if the platform needs to search within it. |
| `ResourceChunkConcept` | `resource_chunk_id`, `concept_id` | Topics covered by a section of material. |
| `LearningSession` | `id`, `learner_id`, `course_id`, `started_at`, `ended_at` | A period when a student uses the learning platform. |
| `InteractionEvent` | `event_id`, `learner_id`, `course_id`, `session_id`, `event_type`, `occurred_at`, `received_at`, `schema_version`, `client_sequence`, `learning_item_id`, `is_correct`, `payload` | One recorded action. Includes every answer attempt, hint request, and material opening. It does not include answer duration or the student's full answer. |
| `MasterySnapshot` | `id`, `learner_id`, `course_id`, `concept_id`, `mastery`, `model_name`, `model_version`, `computed_at`, `based_on_event_id` | A dated estimate of the student's understanding of a topic, so progress can be viewed over time. |
| `RoutingDecision` | `id`, `learner_id`, `course_id`, `session_id`, `trigger_event_id`, `diagnosed_concept_id`, `root_cause_concept_id`, `mastery_before`, `threshold`, `reason_code`, `rationale`, `model_version`, `created_at` | Records why the system suggested a different learning path. |
| `RoutingDecisionStep` | `decision_id`, `position`, `concept_id`, `step_type` | The ordered topics that explain the routing decision. |
| `RoutingRecommendation` | `decision_id`, `learning_item_id`, `position` | Questions or materials suggested by that decision. |

## Main relationships

- One course has learners, instructors, topics, questions, and learning materials.
- Each learner account has a separate random learning ID for activity records.
- A learner can have consent records, sessions, answer attempts, and progress snapshots.
- Each question belongs to one topic.
- A topic can depend on another topic.
- A routing decision can include several explanation steps and recommendations.

## Important rules

- A student's university email is unique. A student can be enrolled in the pilot course once.
- Each topic has a unique course-and-topic key.
- A question must belong to exactly one topic.
- A topic cannot be its own prerequisite. Prerequisites must stay within the same course and cannot form a loop.
- Only active consent allows new learning activity to be recorded.
- Withdrawal changes the consent status to withdrawn and stops new learning-event collection.
- The approved ethics and consent rules must say whether existing records are deleted, kept, or made no longer linkable after withdrawal. This is still undecided.
- Each answer attempt is a separate event with `is_correct=true` or `is_correct=false`. Do not replace earlier attempts with the latest one.
- Hint requests and material openings are separate event types, so their counts can be calculated later.
- Do not store response duration, full typed answers, student names, emails, or official course grades in the interaction log.
- Instructors see names and progress only for courses they teach. Research exports use the random learning ID and exclude account details.
- Keep interaction events append-only during normal use. Any correction should be recorded transparently rather than silently changing history.

## Interaction log format

Store one event per database row. When exported, write one event per line in JSON Lines (JSONL) format. The example below records an incorrect attempt. There is no answer text or response-time field.

```json
{
  "event_id": "a8c5fc14-121d-4a84-a26b-4306d770f39d",
  "schema_version": "1.0",
  "event_type": "answer_submitted",
  "learner_id": "4a84b0da-42de-4b9b-a5ed-eb431d48c922",
  "course_id": "course-x-2026",
  "session_id": "f3ee98b5-9329-4c53-a83c-9b2b2b41c35c",
  "client_sequence": 12,
  "occurred_at": "2026-10-26T10:15:30Z",
  "received_at": "2026-10-26T10:15:31Z",
  "learning_item_id": "item-017",
  "is_correct": false,
  "payload": {
    "answer_format": "multiple_choice"
  }
}
```

Other event types include `hint_requested` and `resource_opened`. For those events, `is_correct` is empty. `occurred_at` is when the action happened according to the device; `received_at` is the server's UTC time. These timestamps help order attempts and show progress over time. They are not a measure of how long the student took.

## Consent and privacy

- The platform needs a student's account to provide login and show instructors the student's name and progress. This means the activity is pseudonymous for research, not fully anonymous while the system can reconnect the activity to an account.
- Keep the identity link protected by application permissions. Do not include account IDs, names, or university emails in research exports.
- Use Django's password hashing; never log or export passwords.
- Do not begin pilot learning-event collection until the required institutional approval and consent process are in place.
- The consent form and approved protocol need to explain what is collected, who can see it, how long it is kept, and what happens to existing records if a student withdraws.
- Any shared dataset must follow the approved protocol and be checked for details that could identify a student.

## Remaining decisions before final implementation

1. If a student withdraws, should already-collected events be deleted, retained for the approved study, or separated from the student's account?
2. What retention period and access list will the supervisor approve?
3. Which vector store, if any, will hold resource embeddings?
4. Must an instructor approve generated questions before students can use them?
