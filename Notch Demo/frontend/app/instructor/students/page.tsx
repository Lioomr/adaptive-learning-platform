import type { Metadata } from "next";
import { StudentRoster } from "@/features/instructor/students/student-roster";

export const metadata: Metadata = { title: "Students · Instructor Portal" };

/** Course roster linking to IN14 Student view. */
export default function Page() {
  return <StudentRoster />;
}
