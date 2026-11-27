import type { Metadata } from "next";
import { InstructorCourses } from "@/features/instructor/portal/courses";

export const metadata: Metadata = { title: "Instructor Courses" };

export default function Page() {
  return <InstructorCourses />;
}
