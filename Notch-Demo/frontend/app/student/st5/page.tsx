
import type { Metadata } from "next";
import { StudentSkillMap } from "@/features/student/student-skill-map";

export const metadata: Metadata = {
  title: "Skill Map | Notch",
  description:
    "Explore your learning progress, concept mastery, and prerequisites.",
};

export default function StudentSkillMapPage() {
  return <StudentSkillMap />;
}
