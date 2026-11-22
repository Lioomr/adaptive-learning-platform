import type { Metadata } from "next";
import { StudentLearningSession } from "@/features/student/student-lesson-v2";

export const metadata: Metadata = {
  title: "Learning Session | Notch",
  description: "Learn a concept, follow an adaptive path, and check your understanding.",
};

export default async function StudentConceptPage({
  params,
}: {
  params: Promise<{ conceptId: string }>;
}) {
  const { conceptId } = await params;
  return <StudentLearningSession conceptId={conceptId} />;
}
