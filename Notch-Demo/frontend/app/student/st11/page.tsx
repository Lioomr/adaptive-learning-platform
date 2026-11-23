import { StudentDiagnosisLadder } from "@/features/student/student-diagnosis-ladder";

export default async function StudentST11Page({ searchParams }: { searchParams: Promise<{ conceptId?: string }> }) {
  const params = await searchParams;
  return <StudentDiagnosisLadder conceptId={params.conceptId ?? "PY-REC"} />;
}
