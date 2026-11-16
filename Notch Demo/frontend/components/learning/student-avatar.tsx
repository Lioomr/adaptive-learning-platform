import { cn } from "@/lib/utils";

const palette = ["bg-[#E0E7FF] text-[#2D4485]", "bg-progress-soft text-progress-ink", "bg-ai-soft text-ai-ink", "bg-[#E2E8F0] text-[#334155]"];

/** Initials avatar for fictional students (no photos in the demo). */
export function StudentAvatar({ name, className }: { name: string; className?: string }) {
  const tone = palette[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % palette.length];
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold", tone, className)}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
