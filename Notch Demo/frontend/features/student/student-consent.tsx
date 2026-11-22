
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  FlaskConical,
  Info,
  CheckCircle2,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";

export function StudentConsent() {
  const router = useRouter();

  const [requiredConsent, setRequiredConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleContinue() {
    if (!requiredConsent) return;

    setSubmitted(true);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        eyebrow="ST2 · Consent & Privacy"
        title="Your privacy matters"
        description="Before continuing, please review how this demonstration platform uses information."
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle>Platform use consent</CardTitle>
                <CardDescription>
                  Required to continue using the demonstration.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40">
              <input
                type="checkbox"
                checked={requiredConsent}
                onChange={(event) => {
                  setRequiredConsent(event.target.checked);
                  setSubmitted(false);
                }}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="text-sm leading-6 text-foreground">
                I understand that Notch is currently a demonstration
                platform. I agree to use its simulated learning
                activities and understand that it uses fictional
                student profiles and sample data.
                <span className="mt-1 block font-semibold text-destructive">
                  Required
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <FlaskConical className="size-5" />
              </div>
              <div>
                <CardTitle>Research participation</CardTitle>
                <CardDescription>
                  Optional — your choice will not affect your learning experience.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40">
              <input
                type="checkbox"
                checked={researchConsent}
                onChange={(event) =>
                  setResearchConsent(event.target.checked)
                }
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className="text-sm leading-6 text-foreground">
                I voluntarily agree to let my simulated interactions
                in this demo be used for educational research
                demonstrations.
                <span className="mt-1 block text-xs font-medium text-muted-foreground">
                  Optional — you can leave this unchecked and continue.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LockKeyhole className="size-5 text-primary" />
              <CardTitle>Privacy information</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              This demo uses fictional student profiles and sample
              learning activities. It does not connect to a live
              student database or process real school records.
            </p>

            <details className="group rounded-xl border border-border p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                Read more about data use
              </summary>

              <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                <p>
                  Demo selections and learning activity may be stored
                  locally in your browser to support the simulated
                  experience.
                </p>
                <p>
                  This demonstration does not provide real account
                  authentication, and local demo data does not sync
                  across different browsers or devices.
                </p>
                <p>
                  Please do not enter real passwords or sensitive
                  personal information.
                </p>
              </div>
            </details>

            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs leading-5 text-muted-foreground">
                This is demonstration privacy information, not a
                formal legal privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Returning student?
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Your returning-student journey is simulated in this
                demo. No real account or previous consent record is
                being verified or restored here.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            disabled={!requiredConsent}
            onClick={handleContinue}
          >
            Continue to preferences
            <ArrowRight className="size-4 rtl:-scale-x-100" />
          </Button>

          {!requiredConsent && (
            <p className="text-center text-xs text-muted-foreground">
              Please accept the required platform-use consent to continue.
            </p>
          )}

          {submitted && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-soft p-4"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-ink" />

              <div>
                <p className="font-semibold text-foreground">
                  Consent recorded for this demo session
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Required consent: Accepted
                </p>

                <p className="text-sm text-muted-foreground">
                  Research consent: {researchConsent ? "Accepted" : "Not accepted"}
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  This is a temporary UI simulation; your choices are
                  not submitted to a real consent-management system.
                </p>

                <Button
                  className="mt-4 w-full"
                  onClick={() => router.push("/student/st3")}
                >
                  Go to preferences
                  <ArrowRight className="size-4 rtl:-scale-x-100" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
