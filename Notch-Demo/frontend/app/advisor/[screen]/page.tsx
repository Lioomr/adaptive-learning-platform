import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdvisorScreen, type Screen } from "@advisor/components/advisor-screen";
import { AdvisorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
const screens: Screen[] = ["ad1", "ad2", "ad3", "ad4", "ad5", "ad6"];
export function generateStaticParams() {
  return screens.map((screen) => ({ screen }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  if (!screens.includes(screen as Screen)) notFound();
  return (
    <Suspense fallback={<AdvisorPreviewSkeleton />}>
      <AdvisorScreen screen={screen as Screen} />
    </Suspense>
  );
}
