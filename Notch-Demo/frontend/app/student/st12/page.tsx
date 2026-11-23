import { StudentLearningRoadmap } from "@/features/student/student-learning-roadmap";

export default async function StudentST12Page({ searchParams }: { searchParams: Promise<{ conceptId?: string }> }) {
  const params = await searchParams;
  return <StudentLearningRoadmap conceptId={params.conceptId ?? "PY-REC"} />;
}
