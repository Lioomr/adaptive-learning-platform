"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useRole } from "@/components/layout/role-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions";
import { useDemo } from "@/store/demo";

/** Confirmed reset to baseline fixtures. Only rendered where the role may reset (Demo Control Center). */
export function ResetDemoButton({ variant = "outline", onReset }: { variant?: "outline" | "default"; onReset?: () => void }) {
  const role = useRole();
  const reset = useDemo(s => s.reset);
  const attempts = useDemo(s => s.attempts.length);
  const [message, setMessage] = useState("");
  if (!can(role, "demo:reset")) return null;
  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={variant} data-tour="reset">
            <RotateCcw aria-hidden="true" />
            Reset demo
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Reset the demo?</AlertDialogTitle>
          <AlertDialogDescription>
            This restores all ten fictional students to their baseline mastery, removes {attempts === 1 ? "1 recorded attempt" : `${attempts} recorded attempts`}, and selects Nour in Introduction to Python. It only affects this browser.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const r = reset(role);
                setMessage(r.ok ? "Demo reset to baseline." : r.error);
                onReset?.();
              }}
            >
              Reset demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <span role="status" className="sr-only">{message}</span>
    </>
  );
}
