import type { Metadata } from "next";
import { StudentOnboarding } from "@/features/student/student-onboarding";

export const metadata: Metadata = {
  title: "Student Onboarding | Notch",
  description: "Choose your course and start your Notch demo learning journey.",
};

export default function StudentOnboardingPage() {
  return <StudentOnboarding />;
}