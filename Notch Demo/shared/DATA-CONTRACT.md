# Data contract

[TypeScript interfaces](../frontend/types/index.ts) define course IDs, roles, concepts, students, questions, assessment submissions and attempts. Students list enrolled course IDs; mastery is numeric by concept. The baseline has ten fictional students, both enrolled in both courses, and twenty concepts. [Fixtures](../frontend/data/fixtures.ts) contain only two illustrative questions, which are not the reviewed assessment bank.

Submission IDs must be unique per intended attempt and remain the same for a retry. Inputs and idempotency are validated centrally in the store and mastery service; components must not write mastery directly. See [events and state](EVENTS-AND-STATE.md) for rounding, persistence and reset. Future question types, difficulty metadata and richer profiles remain part of MAH-28 and subsequent portal work.
