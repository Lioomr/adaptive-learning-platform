/**
 * IN1 Onboarding & instructor boundaries — local copy (Demo / Simulated).
 * Describes what the simulated instructor persona can and cannot do in Phase 1.
 * Assignment itself comes from data/fixtures.ts via lib/permissions.ts.
 */

export type BoundaryItem = { id: string; title: string; detail: string };

export const canDo: BoundaryItem[] = [
  { id: "can-course", title: "See your assigned course only", detail: "Concepts, materials and class-level progress for the course you are assigned to." },
  { id: "can-approve", title: "Approve AI suggestions before students see them", detail: "Proposed concepts, prerequisite links and questions stay as drafts until you approve them." },
  { id: "can-students", title: "View learning progress of enrolled students", detail: "Concept mastery and practice activity, to understand where the class is stuck." },
  { id: "can-materials", title: "Add and version course materials", detail: "Materials are the source for suggested concepts and tutor answers." },
];

export const cannotDo: BoundaryItem[] = [
  { id: "no-other-courses", title: "Open other instructors' courses", detail: "Course data is limited to your assignment." },
  { id: "no-advisor", title: "Read advisor check-in notes", detail: "Advisor notes and cross-course indicators remain with the advisor." },
  { id: "no-grades", title: "Change official grades or records", detail: "Mastery estimates are learning signals, not grades." },
  { id: "no-auto-publish", title: "Publish AI content without review", detail: "Nothing generated is shown to students until an instructor approves it." },
];

export type OnboardingStep = { id: string; title: string; description: string };

export const steps: OnboardingStep[] = [
  { id: "assignment", title: "Confirm your course assignment", description: "Check that the course shown is the one you teach." },
  { id: "boundaries", title: "Review instructor boundaries", description: "What you can see and approve, and what stays private." },
  { id: "data", title: "Understand simulated data", description: "This demo uses fictional students and simulated mastery." },
  { id: "materials", title: "Add course materials", description: "Continue to IN2 to add sample materials for concept extraction." },
];

export const dataNotes: string[] = [
  "All students are fictional; no real personal data is stored.",
  "Mastery values follow the shared demo rule and are not validated BKT, DKT or IRT.",
  "Uploads, extraction and approvals change on-screen demo state only.",
  "Demo state lives in this browser and does not sync to other devices.",
];
