import type { Metadata } from "next";
import { MaterialsWorkspace } from "@/features/instructor/materials/materials-workspace";

export const metadata: Metadata = { title: "Upload materials · Instructor" };

/** IN2 Upload materials (simulated). */
export default function Page() {
  return <MaterialsWorkspace />;
}
