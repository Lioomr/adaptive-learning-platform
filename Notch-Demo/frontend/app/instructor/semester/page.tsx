import type { Metadata } from "next";
import { SemesterPrep } from "@/features/instructor/semester/semester-prep";

export const metadata: Metadata = { title: "Semester Preparation" };

export default function Page() {
  return <SemesterPrep />;
}
