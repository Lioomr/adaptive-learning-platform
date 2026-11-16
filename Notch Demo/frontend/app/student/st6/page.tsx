import type { Metadata } from "next";
import { StudentHome } from "@/features/student/student-home";

export const metadata: Metadata = {
  title: "Student Home | Notch",
  description: "Your personalized learning home in Notch.",
};

export default function StudentHomePage() {
  return <StudentHome />;
}
