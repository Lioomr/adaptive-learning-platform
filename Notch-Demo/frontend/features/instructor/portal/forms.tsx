"use client";
import { useId } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Copy } from "./data";
import { useInstructor } from "./context";

export const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

/**
 * Update the visible language of a bilingual value. While both languages hold the
 * same text (a brand-new item) the other language mirrors it, so nothing is empty.
 */
export function editCopy(
  prev: Copy,
  language: "en" | "ar",
  value: string,
): Copy {
  const i = language === "ar" ? 1 : 0;
  const o = 1 - i;
  const next: [string, string] = [prev[0], prev[1]];
  next[i] = value;
  if (!prev[o] || prev[o] === prev[i]) next[o] = value;
  return next;
}
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; describedBy?: string }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children({ id, describedBy })}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
export function TextInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return <input className={cn(fieldClass, "h-11", className)} {...props} />;
}
export function TextArea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(fieldClass, "min-h-24 resize-y py-2.5 leading-6", className)}
      {...props}
    />
  );
}
export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return <select className={cn(fieldClass, "h-11", className)} {...props} />;
}

/** Modal editor used for every create and edit flow. Children hold the fields. */
export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  wide = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const { t, language } = useInstructor();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          dir={language === "ar" ? "rtl" : "ltr"}
          className={cn(
            "fixed start-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 shadow-raised rtl:translate-x-1/2 sm:p-8",
            wide ? "max-w-2xl" : "max-w-xl",
          )}
        >
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-3 top-3"
              aria-label={t("Close", "إغلاق")}
            >
              <X />
            </Button>
          </Dialog.Close>
          <Dialog.Title className="pe-8 text-xl font-semibold tracking-tight">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
            {description}
          </Dialog.Description>
          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {children}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="outline">{t("Cancel", "إلغاء")}</Button>
              </Dialog.Close>
              <Button type="submit">{submitLabel}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDelete({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  const { t, language } = useInstructor();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={language === "ar" ? "rtl" : "ltr"}>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:brightness-90"
            onClick={onConfirm}
          >
            {t("Delete", "حذف")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Polite status line for confirmations such as "Saved". */
export function Status({ message }: { message: string }) {
  return (
    <p role="status" aria-live="polite" className="min-h-5 text-sm text-success">
      {message}
    </p>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mb-4 mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {action}
    </div>
  );
}
