import { cn } from "@/lib/utils";

/** AdaptLearn mark: an "A" whose crossbar is a progress step, with a teal mastery dot. */
export function BrandMark({ className, tone = "onDark" }: { className?: string; tone?: "onDark" | "onLight" }) {
  const tile = tone === "onDark" ? "#FFFFFF" : "#1E2B58";
  const stroke = tone === "onDark" ? "#1E2B58" : "#FFFFFF";
  const bar = tone === "onDark" ? "#2D4485" : "#C7D0E8";
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill={tile} />
      <path d="M9 23.5 15.1 8.6a1 1 0 0 1 1.8 0L23 23.5" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.9 18.2h5.6" stroke={bar} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="21.6" cy="18.2" r="2.2" fill="#0D9488" />
    </svg>
  );
}

export function BrandWordmark({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <BrandMark />
      <span className={cn("min-w-0 leading-tight", textClassName)}>
        <span className="block text-[17px] font-semibold tracking-tight text-sidebar-strong">
          Adapt<span className="font-normal text-sidebar-foreground">Learn</span>
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">Notch Demo · Phase 1</span>
      </span>
    </span>
  );
}
