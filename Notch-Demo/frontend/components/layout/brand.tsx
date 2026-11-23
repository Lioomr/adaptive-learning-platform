import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return <Image unoptimized src="/brand/notch-icon.svg" alt="Notch" width={40} height={40} className={cn("size-10 shrink-0 rounded-lg", className)} />;
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Notch" className={cn("block aspect-[777/211] w-28 shrink-0 bg-contain bg-center bg-no-repeat [background-image:var(--notch-wordmark)]", className)} />
  );
}
