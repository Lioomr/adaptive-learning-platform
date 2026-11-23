import type { Metadata } from "next";
import { DemoControlCenter } from "@/features/demo/control-center";

export const metadata: Metadata = { title: "Demo Control Center" };

export default function Page() {
  return <DemoControlCenter />;
}
