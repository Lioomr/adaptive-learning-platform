import type { Metadata } from "next";
import { ConceptApprovals } from "@/features/instructor/approvals/concept-approvals";

export const metadata: Metadata = { title: "Concept approvals (IN3)" };

export default function Page() {
  return <ConceptApprovals />;
}
