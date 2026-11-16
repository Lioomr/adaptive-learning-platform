"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Instructor-portal screen menu (IN1–IN19). Kept inside the instructor feature so shared navigation is untouched. */
const base = routes.instructor;
const groups: { label: string; items: { href: string; label: string; ids: string }[] }[] = [
  { label: "Setup", items: [
    { href: `${base}/onboarding`, label: "Onboarding", ids: "IN1" },
    { href: `${base}/materials`, label: "Materials", ids: "IN2" },
    { href: `${base}/concepts`, label: "Concepts", ids: "IN3" },
    { href: `${base}/graph`, label: "Graph", ids: "IN4" },
    { href: `${base}/questions`, label: "Questions", ids: "IN5" },
    { href: `${base}/settings`, label: "Rules & launch", ids: "IN6" },
    { href: `${base}/signups`, label: "Sign-ups", ids: "IN7" },
  ] },
  { label: "Teaching", items: [
    { href: `${base}/dashboard`, label: "Weekly dashboard", ids: "IN8–9" },
    { href: `${base}/lecture-decision`, label: "Lecture decision", ids: "IN10" },
    { href: `${base}/content-gaps`, label: "Content gaps", ids: "IN11–12" },
    { href: `${base}/at-risk`, label: "At-risk", ids: "IN13" },
    { href: `${base}/students`, label: "Students", ids: "IN14" },
    { href: `${base}/tutor-audit`, label: "Tutor audit", ids: "IN15" },
  ] },
  { label: "Wrap-up", items: [
    { href: `${base}/exam-readiness`, label: "Exam readiness", ids: "IN16–17" },
    { href: `${base}/report`, label: "Report & export", ids: "IN18–19" },
  ] },
];

export function InstructorNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Instructor screens" className="mb-6 overflow-x-auto border-b pb-3">
      <ul className="flex min-w-max gap-4">
        <li>
          <Link href={base} aria-current={pathname === base ? "page" : undefined}
            className={cn("rounded-md px-2 py-1 text-sm hover:bg-muted", pathname === base && "bg-muted font-semibold")}>Overview</Link>
        </li>
        {groups.map(g => (
          <li key={g.label} className="flex items-center gap-1 border-s ps-4">
            <span className="me-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</span>
            <ul className="flex gap-1">
              {g.items.map(i => {
                const active = pathname === i.href || pathname.startsWith(`${i.href}/`);
                return (
                  <li key={i.href}>
                    <Link href={i.href} aria-current={active ? "page" : undefined} title={i.ids}
                      className={cn("rounded-md px-2 py-1 text-sm whitespace-nowrap hover:bg-muted", active && "bg-muted font-semibold")}>
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
