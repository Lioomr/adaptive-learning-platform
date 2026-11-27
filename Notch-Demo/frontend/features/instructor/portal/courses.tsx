"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstructor } from "./context";
import { InstructorCourseCard, InstructorSwitcher, PageTitle } from "./ui";

export function InstructorCourses() {
  const { t, assigned, instructor, num } = useInstructor();
  const [query, setQuery] = useState("");
  const filtered = assigned.filter((c) =>
    `${c.title.join(" ")} ${c.code}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="animate-fade-in">
      <PageTitle
        eyebrow={t("YOUR TEACHING SPACE", "مساحة التدريس الخاصة بك")}
        title={t("Courses you teach.", "المقررات التي تدرّسها.")}
        description={t(
          "Only the courses an Admin has assigned to you appear here. Open one to manage lectures, labs, assignments and grades.",
          "تظهر هنا فقط المقررات التي أسندها إليك المسؤول. افتح مقررًا لإدارة المحاضرات والمعامل والواجبات والدرجات.",
        )}
        action={<InstructorSwitcher />}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="font-medium">
          {t("Assigned courses", "المقررات المسندة")}{" "}
          <span className="ms-2 rounded-full bg-secondary px-2.5 py-1 text-sm text-primary">
            {num(assigned.length)}
          </span>
          <span className="ms-3 text-sm font-normal text-muted-foreground">
            {t(instructor.name)}
          </span>
        </p>
        <label className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 sm:max-w-sm">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
            aria-label={t("Search courses", "البحث في المقررات")}
            placeholder={t("Search by course or code", "ابحث بالمقرر أو الرمز")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <InstructorCourseCard key={c.id} course={c} />
        ))}
      </div>
      {!filtered.length && (
        <div className="rounded-xl border bg-card p-10 text-center">
          <h2 className="text-xl font-semibold">
            {assigned.length
              ? t("No matching courses", "لا توجد مقررات مطابقة")
              : t("No courses assigned yet", "لا توجد مقررات مسندة بعد")}
          </h2>
          <p className="my-3 text-muted-foreground">
            {assigned.length
              ? t(
                  "Try a course name or clear your search.",
                  "جرّب اسم مقرر أو امسح البحث.",
                )
              : t(
                  "An Admin will assign courses to you.",
                  "سيسند إليك المسؤول المقررات.",
                )}
          </p>
          {assigned.length > 0 && (
            <Button variant="outline" onClick={() => setQuery("")}>
              {t("Clear search", "مسح البحث")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
