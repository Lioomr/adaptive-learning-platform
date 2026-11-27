import { Suspense } from "react";
import type { Metadata } from "next";
import { LectureDetail } from "@/features/instructor/semester/lecture-detail";

export const metadata: Metadata = { title: "Lecture · Semester Preparation" };

export default async function Page({ params }: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await params;
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <LectureDetail lectureId={lectureId} />
    </Suspense>
  );
}
