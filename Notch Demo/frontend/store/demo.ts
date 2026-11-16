"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { initialStudents } from "@/data/fixtures";
import { scoreAssessment } from "@/services/mastery";
import type { Attempt, CourseId, Student } from "@/types";
type State={ students:Student[]; attempts:Attempt[]; studentId:string; courseId:CourseId; setStudent:(id:string)=>void; setCourse:(id:CourseId)=>void; submit:(conceptId:string,ids:string[],answers:Record<string,string>)=>void; reset:()=>void };
const baseline=()=>structuredClone(initialStudents);
export const useDemo=create<State>()(persist((set)=>({students:baseline(),attempts:[],studentId:"S-NOUR",courseId:"C-PY",setStudent:id=>set(s=>s.students.some(x=>x.id===id)?{studentId:id}:{}),setCourse:courseId=>set({courseId}),submit:(conceptId,ids,answers)=>set(s=>{const student=s.students.find(x=>x.id===s.studentId); if(!student || !(conceptId in student.mastery)) return {}; const previous=student.mastery[conceptId]; const result=scoreAssessment(s.courseId,conceptId,ids,answers,previous); const attempt:Attempt={id:crypto.randomUUID(),studentId:student.id,courseId:s.courseId,conceptId,questionIds:ids,answers,previous,...result,createdAt:new Date().toISOString()}; return {students:s.students.map(x=>x.id===student.id?{...x,lastActiveDays:0,mastery:{...x.mastery,[conceptId]:result.mastery}}:x),attempts:[...s.attempts,attempt]};}),reset:()=>set({students:baseline(),attempts:[],studentId:"S-NOUR",courseId:"C-PY"})}),{name:"adaptlearn-demo",version:1,storage:createJSONStorage(()=>localStorage),partialize:s=>({students:s.students,attempts:s.attempts,studentId:s.studentId,courseId:s.courseId}) as State,migrate:()=>({students:baseline(),attempts:[],studentId:"S-NOUR",courseId:"C-PY"}) as unknown as State}));
