import type { Metadata } from "next";
import { AssessmentCenter } from "@/features/instructor/qbank/assessments";

export const metadata: Metadata = { title: "Assessment Center" };

export default function Page() {
  return <AssessmentCenter />;
}
