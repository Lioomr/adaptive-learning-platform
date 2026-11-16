"use client";
import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const toneClass = { progress: "bg-progress", success: "bg-success", warning: "bg-warning", danger: "bg-danger", brand: "bg-brand-2", ai: "bg-ai" } as const;
export type ProgressTone = keyof typeof toneClass;

function Progress({ className, value = 0, tone = "progress", ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & { tone?: ProgressTone }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root data-slot="progress" value={v} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <ProgressPrimitive.Indicator className={cn("h-full rounded-full transition-[width] duration-500 ease-out", toneClass[tone])} style={{ width: `${v}%` }} />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
