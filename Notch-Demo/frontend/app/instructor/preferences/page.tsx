import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsPage } from "@/features/instructor/settings/settings-page";

export const metadata: Metadata = { title: "Settings & Permissions" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <SettingsPage />
    </Suspense>
  );
}
