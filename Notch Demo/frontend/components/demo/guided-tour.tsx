"use client";
import { useCallback, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TourStep = { target: string; title: string; body: string };

/**
 * Non-modal guided presentation. Highlights `[data-tour="<target>"]`, scrolls it
 * into view, moves focus to the step heading, closes on Escape and returns focus
 * to the element that opened it. Portal-specific tours (MAH-30) reuse this.
 */
export function GuidedTourOverlay({ steps, step, onStepChange, onClose }: { steps: TourStep[]; step: number; onStepChange: (step: number) => void; onClose: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<Element | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const current = steps[step];

  const close = useCallback(() => {
    onClose();
    const opener = openerRef.current;
    if (opener instanceof HTMLElement) requestAnimationFrame(() => opener.focus());
  }, [onClose]);

  useEffect(() => {
    openerRef.current = document.activeElement;
  }, []);

  useEffect(() => {
    if (!current) return;
    const target = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    target?.setAttribute("data-tour-active", "true");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    headingRef.current?.focus({ preventScroll: true });
    return () => target?.removeAttribute("data-tour-active");
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  if (!current) return null;
  const last = step === steps.length - 1;
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 bg-[var(--notch-brand-ink)]/30 animate-fade-in" />
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="fixed inset-x-4 bottom-4 z-50 rounded-xl border border-border bg-popover p-5 shadow-raised animate-fade-in sm:inset-x-auto sm:end-6 sm:bottom-6 sm:w-[380px]"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-progress-ink">
            Guided tour · {step + 1} of {steps.length}
          </p>
          <button type="button" onClick={close} className="-me-2 -mt-2 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Exit guided tour">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className="mt-2 text-base font-semibold tracking-tight outline-none">
          {current.title}
        </h2>
        <p id={bodyId} className="mt-1.5 text-sm leading-6 text-muted-foreground">{current.body}</p>
        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s.target} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand-2" : "w-1.5 bg-border"}`} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={close}>Skip tour</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={step === 0} onClick={() => onStepChange(step - 1)}>Back</Button>
            <Button size="sm" onClick={() => (last ? close() : onStepChange(step + 1))}>{last ? "Finish" : "Next"}</Button>
          </div>
        </div>
      </div>
    </>
  );
}
