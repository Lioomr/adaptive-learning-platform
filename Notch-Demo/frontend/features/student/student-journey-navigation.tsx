"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { path: "/student/st1", label: "Profile" },
  { path: "/student/st2", label: "Consent" },
  { path: "/student/st3", label: "Preferences" },
  { path: "/student/st4", label: "Diagnostic" },
  { path: "/student/st5", label: "Skill map" },
  { path: "/student/st6", label: "Dashboard" },
  { path: "/student/st7", label: "Course" },
];

export function StudentJourneyNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentIndex = steps.findIndex((step) => step.path === pathname);

  if (currentIndex < 0) return null;

  const currentStep = steps[currentIndex];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 pb-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          Student journey <span className="text-muted-foreground">· Step {currentIndex + 1} of {steps.length}</span>
        </p>
        {currentIndex > 0 && (
          <Button variant="ghost" size="sm" onClick={() => router.push(steps[currentIndex - 1].path)}>
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            Back
          </Button>
        )}
      </div>
      <div className="flex gap-1.5" aria-label={`Step ${currentIndex + 1} of ${steps.length}`}>
        {steps.map((step, index) => (
          <div key={step.path} className="min-w-0 flex-1">
            <div className={`h-1.5 rounded-full ${index <= currentIndex ? "bg-primary" : "bg-muted"}`} />
            <p className={`mt-1 hidden truncate text-[11px] sm:block ${index === currentIndex ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {index < currentIndex ? <Check className="inline size-3" /> : null} {step.label}
            </p>
          </div>
        ))}
      </div>
      <p className="sr-only">Current step: {currentStep.label}</p>
    </div>
  );
}
