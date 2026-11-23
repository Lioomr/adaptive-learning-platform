
import type { Metadata } from "next";
import { StudentConsent } from "@/features/student/student-consent";

export const metadata: Metadata = {
  title: "Consent & Privacy | Notch",
  description: "Review the Notch demo consent and privacy information.",
};

export default function StudentConsentPage() {
  return <StudentConsent />;
}
