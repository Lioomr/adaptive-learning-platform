import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StudentCourse } from "@/features/student/portal/course";
import {
  courses,
  sections,
  sectionLabels,
  type Section,
} from "@/features/student/portal/data";
type Props = { params: Promise<{ courseId: string; section?: string[] }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseId, section } = await params;
  const course = courses.find((c) => c.id === courseId);
  const tab = sections.find((s) => s === section?.[0]) ?? "progress";
  return {
    title: course
      ? `${course.title[0]} · ${sectionLabels[tab][0]}`
      : "Course not found",
  };
}
async function CourseContent({ params }: Props) {
  const { courseId, section } = await params;
  const course = courses.find((c) => c.id === courseId);
  const tab = section?.[0] ?? "progress";
  if (
    !course ||
    (section?.length ?? 0) > 1 ||
    !sections.includes(tab as Section)
  )
    notFound();
  return (
    <StudentCourse
      key={`${course.id}:${tab}`}
      id={course.id}
      section={tab as Section}
    />
  );
}

export default function Page(props: Props) {
  return (
    <Suspense
      fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}
    >
      <CourseContent {...props} />
    </Suspense>
  );
}
