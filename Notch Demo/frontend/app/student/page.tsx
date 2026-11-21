import type { Metadata } from "next";
import Link from "next/link";
import { StudentOverview } from "@/features/student/student-overview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Student Portal" };

export default function Page() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Start your student journey</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set up your profile, preferences, complete a diagnostic, and explore your personalized learning space.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/student/st1">
                Start journey
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <StudentOverview />
    </>
  );
}
