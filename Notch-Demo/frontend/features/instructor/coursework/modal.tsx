"use client";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useInstructor } from "@/features/instructor/portal/context";

/** Dialog with a free-form footer, for flows that need more than one submit action. */
export function Modal({ open, onOpenChange, title, description, size = "md", footer, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; size?: "md" | "lg" | "xl"; footer?: React.ReactNode; children: React.ReactNode }) {
  const { t, language } = useInstructor();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content dir={language === "ar" ? "rtl" : "ltr"} aria-describedby={undefined} className={cn("fixed start-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-card shadow-raised rtl:translate-x-1/2", size === "md" ? "max-w-xl" : size === "lg" ? "max-w-3xl" : "max-w-4xl")}>
          <div className="relative border-b p-5 pe-14 sm:px-7">
            <Dialog.Title className="text-xl font-semibold tracking-tight">{title}</Dialog.Title>
            {description && <Dialog.Description className="mt-1 text-sm text-muted-foreground">{description}</Dialog.Description>}
            <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t("Close", "إغلاق")}><X /></Button></Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:px-7">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-7">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Confirmation for consequential actions. `danger` styles the action as destructive. */
export function Confirm({ open, onOpenChange, title, description, action, danger = true, onConfirm }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; action: string; danger?: boolean; onConfirm: () => void }) {
  const { t, language } = useInstructor();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={language === "ar" ? "rtl" : "ltr"}>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
          <AlertDialogAction className={danger ? "bg-destructive text-destructive-foreground hover:brightness-90" : undefined} onClick={onConfirm}>{action}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const checkbox = "size-4 accent-[var(--color-primary)]";
export const row = "flex items-center gap-3 rounded-lg border p-2.5 text-sm";
/** datetime-local helpers, fixed to Cairo time like the rest of the demo. */
export const iso16 = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)).replace(" ", "T");
export const toIso = (local: string) => `${local}:00+02:00`;
