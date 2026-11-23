import { cn } from "@/lib/utils";

const palette = [
  "bg-secondary text-secondary-foreground",
  "bg-muted text-foreground",
  "bg-info-soft text-info-ink",
  "bg-success-soft text-success-ink",
];

/** Initials avatar for fictional students (no photos in the demo). */
export function StudentAvatar({ name, className }: { name: string; className?: string }) {
  const tone = palette[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % palette.length];
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold", tone, className)}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
