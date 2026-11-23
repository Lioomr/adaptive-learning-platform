import type { Metadata } from "next";
import { StudentCourseHome } from "@/features/student/student-course-home";

export const metadata: Metadata = {
  title: "Course Home | Notch",
  description: "Explore your course concepts and start learning.",
};

export default function StudentCourseHomePage() {
  return <StudentCourseHome />;
}