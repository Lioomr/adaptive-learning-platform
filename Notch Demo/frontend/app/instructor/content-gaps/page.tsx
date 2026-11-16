import type { Metadata } from "next";
import { ContentGapsScreen } from "@/features/instructor/p1/content-gaps";

export const metadata: Metadata = { title: "Content gaps · IN11–IN12" };

export default function Page() {
  return <ContentGapsScreen />;
}
