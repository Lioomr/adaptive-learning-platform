import { StudentPracticeSession } from "@/features/student/student-practice-session";

export default async function StudentPracticePage({ searchParams }: { searchParams: Promise<{ conceptId?: string }> }) {
  const params = await searchParams;
  return <StudentPracticeSession conceptId={params.conceptId ?? "PY-REC"} />;
}
