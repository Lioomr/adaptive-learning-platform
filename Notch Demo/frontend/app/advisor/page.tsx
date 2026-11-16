import type { Metadata } from "next";
import { AdvisorOverview } from "@/features/advisor/advisor-overview";

export const metadata: Metadata = { title: "Advisor Portal" };

export default function Page() {
  return <AdvisorOverview />;
}
