import type { Metadata } from "next";
import { StudentHome } from "@/features/student/portal/home";
export const metadata: Metadata = { title: "Student Home" };
export default function Page() {
  return <StudentHome />;
}
