import type { Metadata } from "next";
import { QuestionApprovals } from "@/features/instructor/approvals/question-approvals";

export const metadata: Metadata = { title: "Question approvals (IN5)" };

export default function Page() {
  return <QuestionApprovals />;
}
