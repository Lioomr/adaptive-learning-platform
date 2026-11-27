import type { Metadata } from "next";
import { QuestionBank } from "@/features/instructor/qbank/dashboard";

export const metadata: Metadata = { title: "Question Bank" };

export default function Page() {
  return <QuestionBank />;
}
