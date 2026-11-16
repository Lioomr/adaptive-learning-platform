import type { Metadata } from "next";
import { SignupsScreen } from "@/features/instructor/p1/signups";

export const metadata: Metadata = { title: "Sign-up monitoring · IN7" };

export default function Page() {
  return <SignupsScreen />;
}
