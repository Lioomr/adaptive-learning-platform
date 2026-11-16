import { concepts, questions } from "@/data/fixtures";
import type { CourseId, Student } from "@/types";
export const clamp = (value:number) => Math.max(0,Math.min(100,Math.round(value)));
export const status = (value:number) => value < 40 ? "Needs Support" : value < 70 ? "Developing" : value < 85 ? "Proficient" : "Mastered";
export function recommendation(student:Student, conceptId:string) { const c=concepts.find(x=>x.id===conceptId); if(!c) return "Select a concept."; const missing=c.prerequisites.find(id=>(student.mastery[id]??0)<70); return missing ? `Review ${concepts.find(x=>x.id===missing)?.title} first.` : `Ready to practice ${c.title}.`; }
export function scoreAssessment(courseId:CourseId,conceptId:string,ids:string[],answers:Record<string,string>,previous:number) { const selected=ids.map(id=>questions.find(q=>q.id===id)); if(!ids.length || new Set(ids).size!==ids.length || selected.some(q=>!q || q.courseId!==courseId || q.conceptId!==conceptId)) throw new Error("Invalid assessment questions"); const correct=selected.filter(q=>q && answers[q.id]===q.answer).length; const score=clamp(100*correct/ids.length); return {score,mastery:clamp(.6*previous+.4*score)}; }
