"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShellCopyContext } from "@/components/layout/shell-copy";
import { AppShell } from "@/components/layout/app-shell";
import { InstructorNav } from "@/features/instructor/instructor-nav";
import { courses } from "@/features/student/portal/data";
import { useHydrated } from "@/hooks/use-hydrated";
import { useDemo } from "@/store/demo";
import { initialStudents } from "@/data/fixtures";
import { instructorAccounts, type Copy, type CourseId } from "./data";
import { useInstructorPortal } from "./store";
import { useSettings } from "@/features/instructor/settings/store";

const ReadyContext = createContext(false);
const shellArabic: Record<string, string> = {
  Instructor: "المدرّس",
  "Instructor Portal": "بوابة المدرّس",
  Home: "الرئيسية",
  Dashboard: "لوحة المتابعة",
  Courses: "المقررات",
  Chatbot: "المساعد الذكي",
  "Semester Preparation": "تحضير الفصل",
  "Question Bank": "بنك الأسئلة",
  "My Courses": "مقرراتي",
  "Pending Approvals": "الاعتمادات المعلّقة",
  Students: "الطلاب",
  Assessments: "التقييمات",
  Coursework: "الأعمال الدراسية",
  "Learning Analytics": "تحليلات التعلم",
  "AI Tutor Monitoring": "مراقبة المساعد الذكي",
  Reports: "التقارير",
  Settings: "الإعدادات",
  "Course tools": "أدوات المقرر",
  "Assessment Center": "مركز التقييم",
  Primary: "التنقل الرئيسي",
  Portals: "التنقل",
  "Skip to main content": "انتقل إلى المحتوى",
  "Simulation mode": "وضع المحاكاة",
  "Fictional students. Progress is simulated and stays in this browser.":
    "طلاب خياليون. يُحفظ التقدم التجريبي في هذا المتصفح.",
  "Collapse sidebar": "طي القائمة الجانبية",
  "Expand sidebar": "توسيع القائمة الجانبية",
  Appearance: "المظهر",
  "System appearance": "مظهر النظام",
  Light: "فاتح",
  Dark: "داكن",
  "Demo · Simulated": "عرض تجريبي · محاكاة",
  "All people and outcomes are fictional and simulated":
    "جميع الأشخاص والنتائج خيالية وتجريبية",
  "Open navigation": "فتح القائمة",
  "Close navigation": "إغلاق القائمة",
  Navigation: "التنقل",
  "Switch between the demo portals.": "التنقل بين صفحات المنصة.",
  "Notch demo home": "صفحة نوتش التجريبية",
  Breadcrumb: "مسار التنقل",
};

/** Workspace routes use the Student-style shell; the IN1–IN19 screens keep their own chrome. */
export const isWorkspacePath = (pathname: string) =>
  pathname === "/instructor" ||
  /^\/instructor\/(courses|chatbot|semester|question-bank|assessments|approvals|student-management|content-issues|out-of-bound|calendar|analytics|reports|coursework|preferences)(\/|$)/.test(pathname);

export function useInstructor() {
  const language = useInstructorPortal((s) => s.language);
  const instructorId = useInstructorPortal((s) => s.instructorId);
  const content = useInstructorPortal((s) => s.content);
  const ready = useContext(ReadyContext);
  const instructor =
    instructorAccounts.find((i) => i.id === instructorId) ??
    instructorAccounts[0];
  const demoStudents = useDemo((s) => s.students);
  const assigned = courses.filter((c) => instructor.courseIds.includes(c.id));
  const t = (en: string | Copy, ar?: string) =>
    typeof en === "string"
      ? language === "ar"
        ? (ar ?? shellArabic[en] ?? en)
        : en
      : en[language === "ar" ? 1 : 0];
  /** User-authored text may exist in one language only; fall back to the other. */
  const pick = (value: Copy) =>
    (language === "ar" ? value[1] || value[0] : value[0] || value[1]) ?? "";
  const date = (
    value: string,
    options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
  ) =>
    new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
      timeZone: "Africa/Cairo",
      ...options,
    }).format(new Date(value));
  const num = (n: number) =>
    new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-GB").format(n);
  const can = (courseId: CourseId) => instructor.courseIds.includes(courseId);
  return {
    language,
    instructor,
    assigned,
    can,
    content,
    students: demoStudents.length ? demoStudents : initialStudents,
    ready,
    t,
    pick,
    date,
    num,
  };
}

export function InstructorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stored = useInstructorPortal((s) => s.language);
  const unavailable = useInstructorPortal((s) => s.storageUnavailable);
  const [ready, setReady] = useState(false);
  const sharedReady = useHydrated();
  const pathname = usePathname();
  const workspace = isWorkspacePath(pathname);
  const language = workspace ? stored : "en";
  useEffect(() => {
    void Promise.resolve(useInstructorPortal.persist.rehydrate()).finally(() =>
      setReady(true),
    );
  }, []);
  const instructorId = useInstructorPortal((s) => s.instructorId);
  const prefs = useSettings((s) => s.saved[instructorId]?.language);
  useEffect(() => {
    void Promise.resolve(useSettings.persist.rehydrate());
  }, []);
  const forced = workspace && prefs && prefs.direction !== "auto" ? prefs.direction : null;
  const textSize = workspace ? (prefs?.textSize ?? 100) : 100;
  const reduceMotion = workspace && !!prefs?.reduceMotion;
  const underline = workspace && !!prefs?.underlineLinks;
  useEffect(() => {
    const html = document.documentElement;
    const previous = { lang: html.lang, dir: html.dir, size: html.style.fontSize };
    html.lang = language;
    html.dir = forced ?? (language === "ar" ? "rtl" : "ltr");
    html.style.fontSize = textSize === 100 ? "" : textSize + "%";
    html.dataset.reduceMotion = String(reduceMotion);
    html.dataset.underlineLinks = String(underline);
    return () => {
      html.lang = previous.lang;
      html.dir = previous.dir;
      html.style.fontSize = previous.size;
      delete html.dataset.reduceMotion;
      delete html.dataset.underlineLinks;
    };
  }, [language, forced, textSize, reduceMotion, underline]);
  return (
    <ReadyContext.Provider value={ready && sharedReady}>
      <ShellCopyContext.Provider
        value={{
          text: (value) =>
            language === "ar" ? (shellArabic[value] ?? value) : value,
          name: (_id, fallback) => fallback,
          direction: language === "ar" ? "rtl" : "ltr",
        }}
      >
        <AppShell role="instructor" studentWorkspace={workspace}>
          {unavailable && workspace && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-warning-soft p-3 text-sm text-warning"
            >
              {language === "ar"
                ? "التخزين غير متاح. ستظل التغييرات لهذه الزيارة فقط."
                : "Browser storage is unavailable. Changes will last for this visit only."}
            </p>
          )}
          {!workspace && <InstructorNav />}
          {children}
        </AppShell>
      </ShellCopyContext.Provider>
    </ReadyContext.Provider>
  );
}
