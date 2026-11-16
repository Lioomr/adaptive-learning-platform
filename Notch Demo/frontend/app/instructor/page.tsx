import type { Metadata } from "next";
import { InstructorOverview } from "@/features/instructor/instructor-overview";

export const metadata: Metadata = { title: "Instructor Portal" };

export default function Page() {
  return <InstructorOverview />;
}
