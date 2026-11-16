import * as React from "react";
import { cn } from "@/lib/utils";

/** Shimmer placeholder. Decorative: wrap groups in an element with role="status" and a label. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn("skeleton-shimmer rounded-md", className)} {...props} />;
}

export { Skeleton };
