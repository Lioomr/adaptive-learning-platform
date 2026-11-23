import type { Metadata } from "next";
import { InstructorOnboarding } from "@/features/instructor/onboarding/instructor-onboarding";

export const metadata: Metadata = { title: "Onboarding · Instructor" };

/** IN1 Onboarding & instructor boundaries (simulated). */
export default function Page() {
  return <InstructorOnboarding />;
}
