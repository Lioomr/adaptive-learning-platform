import { concepts, courses, questions } from "@/data/fixtures";
import type { AssessmentSubmission, Role, Student } from "@/types";
export const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
export const status = (value: number) => value < 40 ? "Needs Support" : value < 70 ? "Developing" : value < 85 ? "Proficient" : "Mastered";
export function recommendation(student: Student, conceptId: string) { const c = concepts.find(x => x.id === conceptId); if (!c) return "Select a concept."; const missing = c.prerequisites.find(id => (student.mastery[id] ?? 0) < 70); return missing ? `Review ${concepts.find(x => x.id === missing)?.title} first.` : `Ready to practice ${c.title}.`; }
export function scoreAssessment(input: AssessmentSubmission, student: Student | undefined, role: Role) {
 if (role !== "student") throw new Error("Only the simulated Student role can submit an assessment.");
 if (!input.submissionId || input.submissionId.length > 128) throw new Error("A valid submission ID is required.");
 if (!student || student.id !== input.studentId || !courses.some(c => c.id === input.courseId) || !student.enrolledCourseIds.includes(input.courseId)) throw new Error("Student is not enrolled in this course.");
 const concept = concepts.find(c => c.id === input.conceptId && c.courseId === input.courseId);
 if (!concept || !Number.isFinite(student.mastery[input.conceptId])) throw new Error("Invalid course or concept.");
 const ids = input.questionIds;
 if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) throw new Error("Select unique assessment questions.");
 const selected = ids.map(id => questions.find(q => q.id === id));
 if (selected.some(q => !q || q.courseId !== input.courseId || q.conceptId !== input.conceptId)) throw new Error("Invalid assessment questions.");
 if (Object.keys(input.answers).some(id => !ids.includes(id)) || selected.some(q => q && input.answers[q.id] !== undefined && !q.options.includes(input.answers[q.id]))) throw new Error("Invalid assessment answer.");
 const correct = selected.filter(q => q && input.answers[q.id] === q.answer).length;
 const score = clamp(100 * correct / ids.length); const previous = clamp(student.mastery[input.conceptId]);
 return { score, previous, mastery: clamp(.6 * previous + .4 * score) };
}
