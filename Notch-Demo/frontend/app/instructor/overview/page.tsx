import type { Metadata } from "next";
import { InstructorOverview } from "@/features/instructor/instructor-overview";

export const metadata: Metadata = { title: "Instructor Screens" };

export default function Page() {
  return <InstructorOverview />;
}
