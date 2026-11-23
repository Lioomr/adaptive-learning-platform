"use client";
import { useShellCopy } from "@/components/layout/shell-copy";
import { useRouter, usePathname } from "next/navigation";
import { useId } from "react";
import { UserRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/components/layout/role-context";
import { courses } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { can, caseloadStudentIds } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { courseAverage } from "@/services/insights";
import { useDemo } from "@/store/demo";
import type { CourseId } from "@/types";

type SelectorProps = { className?: string; size?: "sm" | "default"; hideLabel?: boolean };

function Field({ id, label, hideLabel, className, children }: { id: string; label: string; hideLabel?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <Label htmlFor={id} className={cn(hideLabel && "sr-only")}>{label}</Label>
      {children}
    </div>
  );
}

/** Selected fictional student. Advisor sees only caseload students; Student cannot change it. */
export function StudentSelector({ className, size, hideLabel }: SelectorProps) {
  const { text, name, direction } = useShellCopy();
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const role = useRole();
  const hydrated = useHydrated();
  const students = useDemo(s => s.students);
  const studentId = useDemo(s => s.studentId);
  const courseId = useDemo(s => s.courseId);
  const setStudent = useDemo(s => s.setStudent);
  const visible = role === "advisor" ? students.filter(s => caseloadStudentIds().includes(s.id)) : students;
  const label = role === "advisor" ? "Caseload student" : role === "instructor" ? "Student in focus" : "Student";

  if (!can(role, "context:select-student")) return null;
  return (
    <Field id={id} label={text(label)} hideLabel={hideLabel} className={className}>
      {hydrated ? (
        <Select dir={direction} value={studentId} onValueChange={v => { const result = setStudent(v, role); if (result.ok && role === "advisor") router.replace(`${pathname}?student=${encodeURIComponent(v)}`); }}>
          <SelectTrigger id={id} size={size}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {visible.map(s => (
              <SelectItem key={s.id} value={s.id} description={direction === "rtl" ? `${courseAverage(s, courseId)}٪ في المقرر المحدد` : `${courseAverage(s, courseId)}% in selected course`}>
                {name(s.name,s.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Skeleton className={cn("w-full rounded-lg", size === "sm" ? "h-9" : "h-10")} />
      )}
    </Field>
  );
}

/** Selected course, limited to the selected student's enrollments. */
export function CourseSelector({ className, size, hideLabel }: SelectorProps) {
  const { text, name, direction } = useShellCopy();
  const id = useId();
  const role = useRole();
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const enrolled = useDemo(s => s.students.find(x => x.id === s.studentId)?.enrolledCourseIds ?? []);
  const setCourse = useDemo(s => s.setCourse);

  if (!can(role, "context:select-course")) return null;
  return (
    <Field id={id} label={text("Course")} hideLabel={hideLabel} className={className}>
      {hydrated ? (
        <Select dir={direction} value={courseId} onValueChange={v => setCourse(v as CourseId, role)}>
          <SelectTrigger id={id} size={size}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id} disabled={!enrolled.includes(c.id)}>
                {name(c.id,c.title)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Skeleton className={cn("w-full rounded-lg", size === "sm" ? "h-9" : "h-10")} />
      )}
    </Field>
  );
}

/** Read-only identity chip for portals where the student is fixed (Student portal). */
export function ActiveStudentChip({ className, hideLabel }: { className?: string; hideLabel?: boolean }) {
  const hydrated = useHydrated();
  const name = useDemo(s => s.students.find(x => x.id === s.studentId)?.name);
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <span className={cn("notch-type-label text-foreground", hideLabel && "sr-only")}>Viewing as (simulated)</span>
      {hydrated ? (
        <span className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 text-sm font-medium">
          <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{name}</span>
        </span>
      ) : (
        <Skeleton className="h-9 w-full rounded-lg" />
      )}
    </div>
  );
}

/** Role-aware context controls shown in the top bar (desktop) or context strip (mobile/tablet). */
export function ContextControls({ className, size = "sm", hideLabel }: { className?: string; size?: "sm" | "default"; hideLabel?: boolean }) {
  const role = useRole();
  return (
    <div className={cn("grid grid-cols-2 items-end gap-3", className)}>
      {role === "student" ? <ActiveStudentChip hideLabel={hideLabel} /> : <StudentSelector size={size} hideLabel={hideLabel} />}
      <CourseSelector size={size} hideLabel={hideLabel} />
    </div>
  );
}
