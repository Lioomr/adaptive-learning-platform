import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        brand: "border-transparent bg-secondary text-secondary-foreground",
        progress: "border-transparent bg-progress-soft text-progress-ink",
        success: "border-transparent bg-success-soft text-success-ink",
        warning: "border-transparent bg-warning-soft text-warning-ink",
        danger: "border-transparent bg-danger-soft text-danger-ink",
        ai: "border-transparent bg-ai-soft text-ai-ink",
        outline: "border-border bg-card text-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
