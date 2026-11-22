"use client";
import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible drawer (Radix Dialog): focus trap, Escape to close, focus returns to the trigger. */
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

function SheetContent({ className, children, side = "start", closeLabel = "Close navigation", ...props }: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "start" | "end"; closeLabel?: string }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--notch-brand-ink)]/55 animate-fade-in" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(85vw,300px)] flex-col shadow-raised outline-none",
          side === "start" ? "start-0 animate-sheet-in rtl:animate-sheet-in-rtl" : "end-0 animate-sheet-in-rtl rtl:animate-sheet-in",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute end-3 top-3 grid size-10 place-items-center rounded-lg text-current opacity-80 transition hover:bg-sidebar-accent hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">{closeLabel}</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
