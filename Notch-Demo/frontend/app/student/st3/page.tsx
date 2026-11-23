
import type { Metadata } from "next";
import { StudentPreferences } from "@/features/student/student-preferences";

export const metadata: Metadata = {
  title: "Learning Preferences | Notch",
  description: "Customize your Notch learning and language preferences.",
};

export default function StudentPreferencesPage() {
  return <StudentPreferences />;
}
