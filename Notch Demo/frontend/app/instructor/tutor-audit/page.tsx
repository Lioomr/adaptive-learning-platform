import type { Metadata } from "next";
import { TutorAudit } from "@/features/instructor/tutor-audit/tutor-audit";

export const metadata: Metadata = { title: "Tutor audit · Instructor Portal" };

/** IN15 Tutor audit (Demo / Simulated — no real AI). */
export default function Page() {
  return <TutorAudit />;
}
