import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StudentOverview } from "@/features/student/student-overview";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Student Portal" };

export default function Page() {
  return (
    <StudentOverview>
      <section aria-labelledby="journey-heading" className="relative isolate mb-8 overflow-hidden rounded-2xl border border-[var(--notch-brand-violet-dark)] bg-[var(--notch-brand-ink)] p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 end-0 -z-10 h-20 w-28 bg-[url('/brand/adaptive-path.svg')] bg-contain bg-center bg-no-repeat min-[360px]:w-36 sm:inset-y-0 sm:h-auto sm:w-2/5" />
        <div className="sm:max-w-[58%]">
          <h2 id="journey-heading" className="notch-type-h4">Start your student journey</h2>
          <p className="mt-2 max-w-xl text-[var(--notch-brand-fog)]">
            Set up your profile, choose your preferences, and take a diagnostic to find your starting point.
          </p>
          <Button asChild className="mt-4 bg-[var(--notch-brand-soft-lavender)] text-[var(--notch-brand-ink)] hover:bg-[var(--notch-brand-violet-light)] active:bg-[var(--notch-brand-soft-lavender)]">
            <Link href="/student/st1">Start journey <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" /></Link>
          </Button>
        </div>
      </section>
    </StudentOverview>
  );
}
