import * as React from "react";
import { cn } from "@/lib/utils";

type CardElement = "div" | "section" | "article" | "aside";

/** Semantic card primitives. Use `as="section"` with an `aria-labelledby` heading for page regions. */
function Card({ className, as: Comp = "div", ...props }: React.ComponentProps<"div"> & { as?: CardElement }) {
  return <Comp data-slot="card" className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-card", className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pt-5 sm:px-6 sm:pt-6", className)} {...props} />;
}

function CardTitle({ className, as: Comp = "h2", ...props }: React.ComponentProps<"h2"> & { as?: "h2" | "h3" | "h4" }) {
  return <Comp data-slot="card-title" className={cn("notch-type-h6 text-foreground", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("mt-0.5 text-sm leading-5 text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-5 sm:p-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center gap-3 border-t border-border px-5 py-4 sm:px-6", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
