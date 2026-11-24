import type { Metadata } from "next";
import { StudentCourses } from "@/features/student/portal/courses";
export const metadata: Metadata = { title: "My Courses" };
export default function Page() {
  return <StudentCourses />;
}
