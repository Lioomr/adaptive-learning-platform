import { StudentMasteryAssessment } from "@/features/student/student-mastery-assessment";

export default async function StudentAssessmentPage({ searchParams }: { searchParams: Promise<{ conceptId?: string }> }) {
  const params = await searchParams;
  return <StudentMasteryAssessment conceptId={params.conceptId ?? "PY-REC"} />;
}
