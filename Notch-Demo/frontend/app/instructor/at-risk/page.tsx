import type { Metadata } from "next";
import { AtRiskList } from "@/features/instructor/students/at-risk-list";

export const metadata: Metadata = { title: "At-risk students · Instructor Portal" };

/** IN13 — At-risk students. */
export default function Page() {
  return <AtRiskList />;
}
