import type { Metadata } from "next";
import { GraphReview } from "@/features/instructor/approvals/graph-review";

export const metadata: Metadata = { title: "Graph review (IN4)" };

export default function Page() {
  return <GraphReview />;
}
