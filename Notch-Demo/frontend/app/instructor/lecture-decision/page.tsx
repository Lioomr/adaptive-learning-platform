import type { Metadata } from "next";
import { LectureDecisionScreen } from "@/features/instructor/p1/lecture-decision";

export const metadata: Metadata = { title: "Lecture decision · IN10" };

export default function Page() {
  return <LectureDecisionScreen />;
}
