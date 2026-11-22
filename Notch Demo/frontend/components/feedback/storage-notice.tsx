"use client";
import { Info, X } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useDemo } from "@/store/demo";

const MESSAGES = {
  "reset-invalid": "Saved demo data in this browser was unreadable or inconsistent, so the demo was restored to its baseline fixtures.",
  "reset-version": "Saved demo data came from an older demo version, so the demo was restored to its baseline fixtures.",
  unavailable: "Browser storage is unavailable. The demo works, but progress will not survive a refresh.",
} as const;

/** Explains automatic resets of persisted state instead of failing silently. */
export function StorageNotice() {
  const status = useDemo(s => s.storageStatus);
  const acknowledge = useDemo(s => s.acknowledgeStorageStatus);
  const hydrated = useHydrated();
  if (!hydrated) return null;
  if (status !== "reset-invalid" && status !== "reset-version" && status !== "unavailable") return null;
  return (
    <div role="status" className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-ink">
      <Info className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-6">{MESSAGES[status]}</p>
      {status !== "unavailable" ? (
        <button type="button" onClick={acknowledge} className="-m-1 grid size-8 shrink-0 place-items-center rounded-md hover:bg-warning/10" aria-label="Dismiss notice">
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
