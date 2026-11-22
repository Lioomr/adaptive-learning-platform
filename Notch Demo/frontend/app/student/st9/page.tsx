import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudentPracticePreview({ searchParams }: { searchParams: Promise<{ conceptId?: string }> }) {
  return <main className="mx-auto max-w-3xl p-6"><Card><CardHeader><CardTitle>ST9 · Practice</CardTitle></CardHeader><CardContent className="space-y-4"><p>Practice screen is the next implementation step. This temporary route prevents broken navigation from ST8.</p><Button asChild variant="outline"><Link href="/student/st7">Return to course</Link></Button></CardContent></Card></main>;
}