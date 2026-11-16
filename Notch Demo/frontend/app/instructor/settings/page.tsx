import type { Metadata } from "next";
import { CourseSettingsScreen } from "@/features/instructor/p1/course-settings";

export const metadata: Metadata = { title: "Course rules & launch · IN6" };

export default function Page() {
  return <CourseSettingsScreen />;
}
