"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShellCopyContext } from "@/components/layout/shell-copy";
import { AppShell } from "@/components/layout/app-shell";
import { StudentJourneyNavigation } from "@/features/student/student-journey-navigation";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";
import { initialStudents } from "@/data/fixtures";
import { useStudentPortal, emptyProfile } from "./store";
import { Diagnostic } from "./diagnostic";
import type { Copy } from "./data";

const ReadyContext = createContext(false);
const shellArabic: Record<string, string> = {
  Student: "الطالب",
  "Student Portal": "بوابة الطالب",
  Home: "الرئيسية",
  Dashboard: "لوحة المتابعة",
  Courses: "المقررات",
  Chatbot: "المساعد الذكي",
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
export function useStudent() {
  const language = useStudentPortal((s) => s.language);
  const id = useDemo((s) => s.studentId);
  const student =
    useDemo((s) => s.students.find((p) => p.id === id)) ?? initialStudents[0];
  const profile = useStudentPortal((s) => s.profiles[id]) ?? emptyProfile;
  const ready = useContext(ReadyContext);
  const t = (en: string | Copy, ar?: string) =>
    typeof en === "string"
      ? language === "ar"
        ? (ar ?? shellArabic[en] ?? en)
        : en
      : en[language === "ar" ? 1 : 0];
  const date = (
    value: string,
    options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
  ) =>
    new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
      timeZone: "Africa/Cairo",
      ...options,
    }).format(new Date(value));
  return { language, student, profile, ready, t, date };
}
export function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = useStudentPortal((s) => s.language);
  const unavailable = useStudentPortal((s) => s.storageUnavailable);
  const [ready, setReady] = useState(false);
  const sharedReady = useHydrated();
  const pathname = usePathname();
  const legacy = /^\/student\/st\d+/.test(pathname);
  useEffect(() => {
    void Promise.resolve(useStudentPortal.persist.rehydrate()).finally(() =>
      setReady(true),
    );
  }, []);
  useEffect(() => {
    const html = document.documentElement;
    const previous = { lang: html.lang, dir: html.dir };
    html.lang = language;
    html.dir = language === "ar" ? "rtl" : "ltr";
    return () => {
      html.lang = previous.lang;
      html.dir = previous.dir;
    };
  }, [language]);
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
        <AppShell role="student" studentWorkspace={!legacy}>
          {unavailable && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-warning-soft p-3 text-sm text-warning"
            >
              {language === "ar"
                ? "التخزين غير متاح. ستظل التغييرات لهذه الزيارة فقط."
                : "Browser storage is unavailable. Changes will last for this visit only."}
            </p>
          )}
          {legacy && <StudentJourneyNavigation />}
          {children}
          {!legacy && <Diagnostic />}
        </AppShell>
      </ShellCopyContext.Provider>
    </ReadyContext.Provider>
  );
}
