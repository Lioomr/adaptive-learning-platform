"use client";
import {
  createContext,
  useContext,
  useState,
  Link,
  usePathname,
  Globe2,
  Users,
  Bell,
  Send,
  Route,
  ShieldCheck,
  Activity,
  type ReactNode,
} from "@/features/advisor/runtime";
import { ShellCopyContext } from "@/components/layout/shell-copy";
import { shellArabic } from "../services/shell-language";
import { nameOf } from "../services/language";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import type { Language } from "../services/advisor";
import styles from "./advisor.module.css";
const Locale = createContext<{
  lang: Language;
  t: (en: string, ar: string) => string;
}>({ lang: "en", t: (en) => en });
export const useAdvisorLocale = () => useContext(Locale);
const navigation = [
  ["ad2", "Caseload", "الطلاب", Users],
  ["ad3", "Student overview", "نظرة على الطالب", Activity],
  ["ad5", "Early warning", "تنبيهات مبكرة", Bell],
  ["ad4", "Nudges", "رسائل الدعم", Send],
  ["ad6", "Academic planning", "التخطيط الأكاديمي", Route],
  ["ad1", "Role & privacy", "الدور والخصوصية", ShieldCheck],
] as const;
export function AdvisorLayout({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  const path = usePathname();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  return (
    <Locale.Provider value={{ lang, t }}>
      <div
        className={styles.root}
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang}
      >
        <ShellCopyContext.Provider
          value={{
            text: (value) =>
              lang === "ar" ? (shellArabic[value] ?? value) : value,
            name: (id, fallback) =>
              lang === "ar" ? nameOf(id, lang) : fallback,
            direction: lang === "ar" ? "rtl" : "ltr",
          }}
        >
          <AppShell role="advisor">
            <div className={styles.portal}>
              <div className={styles.workspaceBar}>
                <span>
                  <span className={styles.liveDot} />
                  {t("ACADEMIC ADVISING", "الإرشاد الأكاديمي")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLang(lang === "en" ? "ar" : "en")}
                >
                  <Globe2 aria-hidden="true" />
                  {lang === "en" ? "العربية" : "English"}
                </Button>
              </div>
              <nav
                className={styles.tabs}
                aria-label={t("Advisor screens", "شاشات المرشد")}
              >
                {navigation.map(([id, en, ar, Icon]) => (
                  <Link
                    key={id}
                    href={`/advisor/${id}`}
                    aria-current={
                      path.endsWith(id) || (id === "ad2" && path === "/advisor")
                        ? "page"
                        : undefined
                    }
                  >
                    <Icon size={16} aria-hidden="true" />
                    {t(en, ar)}
                  </Link>
                ))}
              </nav>
              {children}
              <footer className={styles.footer}>
                <ShieldCheck size={16} aria-hidden="true" />
                {t(
                  "Fictional caseload · Simulated guidance · Private tutor conversations are never shown",
                  "طلاب افتراضيون · إرشادات محاكاة · لا تُعرض محادثات المعلم الخاص",
                )}
              </footer>
            </div>
          </AppShell>
        </ShellCopyContext.Provider>
      </div>
    </Locale.Provider>
  );
}
