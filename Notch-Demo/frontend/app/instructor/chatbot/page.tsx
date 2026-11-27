import type { Metadata } from "next";
import { InstructorChatbot } from "@/features/instructor/portal/chatbot";

export const metadata: Metadata = { title: "Teaching Assistant" };

export default function Page() {
  return <InstructorChatbot />;
}
