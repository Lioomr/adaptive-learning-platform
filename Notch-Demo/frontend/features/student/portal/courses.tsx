"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { courses } from "./data";
import { useStudent } from "./context";
import { CourseCard, PageTitle } from "./ui";
import { Button } from "@/components/ui/button";
export function StudentCourses() {
  const { t } = useStudent();
  const [query, setQuery] = useState("");
  const filtered = courses.filter((c) =>
    `${c.title.join(" ")} ${c.code} ${c.instructor.join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="animate-fade-in">
      <PageTitle
        eyebrow={t("YOUR CLASSROOM", "مساحتك الدراسية")}
        title={t("Room to grow.", "مساحة للنمو.")}
        description={t(
          "Five courses. New perspectives. One connected learning journey.",
          "خمسة مقررات وآفاق جديدة ورحلة تعلّم مترابطة.",
        )}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="font-medium">
          {t("Enrolled courses", "المقررات المسجلة")}{" "}
          <span className="ms-2 rounded-full bg-secondary px-2.5 py-1 text-sm text-primary">
            {courses.length}
          </span>
        </p>
        <label className="flex w-full items-center gap-2 rounded-lg border bg-card px-3 sm:max-w-sm">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
            aria-label={t("Search courses", "البحث في المقررات")}
            placeholder={t(
              "Search by course, code, or instructor",
              "ابحث بالمقرر أو الرمز أو المدرّس",
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
      {!filtered.length && (
        <div className="rounded-xl border bg-card p-10 text-center">
          <h2 className="text-xl font-semibold">
            {t("No matching courses", "لا توجد مقررات مطابقة")}
          </h2>
          <p className="my-3 text-muted-foreground">
            {t(
              "Try a course name or clear your search to see all five courses.",
              "جرّب اسم مقرر أو امسح البحث لعرض المقررات الخمسة.",
            )}
          </p>
          <Button variant="outline" onClick={() => setQuery("")}>
            {t("Clear search", "مسح البحث")}
          </Button>
        </div>
      )}
    </div>
  );
}
