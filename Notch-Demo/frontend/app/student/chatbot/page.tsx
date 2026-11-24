import { Suspense } from "react";
import type { Metadata } from "next";
import { StudentChatbot } from "@/features/student/portal/chatbot";
import { courses } from "@/features/student/portal/data";
export const metadata: Metadata = { title: "Learning Assistant" };
async function ChatbotContent({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  const id = courses.find((c) => c.id === course)?.id ?? "python";
  return <StudentChatbot key={id} initialCourse={id} />;
}

export default function Page(props: {
  searchParams: Promise<{ course?: string }>;
}) {
  return (
    <Suspense
      fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}
    >
      <ChatbotContent {...props} />
    </Suspense>
  );
}
