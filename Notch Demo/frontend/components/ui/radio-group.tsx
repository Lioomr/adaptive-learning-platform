"use client";
import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** Arrow-key navigable radio group (Radix). */
function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-2", className)} {...props} />;
}

/** A full-width, touch-friendly option card. */
function RadioOption({ className, children, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-option"
      className={cn(
        "group flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-start text-sm font-medium text-foreground outline-none transition-colors hover:border-primary hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-brand-2 data-[state=checked]:bg-secondary",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="grid size-[18px] shrink-0 place-items-center rounded-full border-2 border-input bg-card transition-colors group-data-[state=checked]:border-brand-2">
        <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-brand-2" />
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioOption };
