import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-center text-[15px] font-semibold leading-[1.4667] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:border-transparent disabled:bg-[var(--notch-disabled-bg)] disabled:text-[var(--notch-disabled-text)] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-[var(--notch-hover)] active:bg-[var(--notch-active)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-primary/15 active:bg-primary/20",
        outline: "border border-input bg-card text-foreground shadow-xs hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-90",
        link: "h-auto px-0 text-brand-2 underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-9 px-3 py-1.5 text-sm",
        lg: "min-h-12 px-5 py-2",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" type={asChild ? undefined : (type ?? "button")} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
