"use client";
import { useEffect, useState } from "react";
import { AlertCircle, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Confirm } from "@/features/instructor/coursework/modal";
import { PageTitle } from "@/features/instructor/portal/ui";
import { SECTIONS, type SectionId } from "./data";
import { AiSection, CourseSection } from "./course";
import { PermissionsSection } from "./permissions";
import { LanguageSection, NotificationsSection } from "./prefs";
import { ProfileSection } from "./profile";
import { useSettingsPage } from "./use-settings";

export function SettingsPage() {
  const p = useSettingsPage();
  const { t, section, dirty, anyDirty, notice, course } = p;
  const [confirm, setConfirm] = useState(false);
  const dirtyList = SECTIONS.filter((s) => dirty[s.id]);
  useEffect(() => {
    if (!anyDirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);
  if (!p.hydrated) return <div className="h-96 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
  const current = SECTIONS.find((s) => s.id === section)!;
  const scoped = section === "course" || section === "ai";
  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle eyebrow={t("SETTINGS", "الإعدادات")} title={t("Settings & Permissions", "الإعدادات والصلاحيات")} description={t("Manage your instructor preferences, course settings, and access permissions.", "أدر تفضيلاتك كمدرّس وإعدادات مقرراتك وصلاحيات الوصول.")} />
      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <nav aria-label={t("Settings sections", "أقسام الإعدادات")} className="lg:sticky lg:top-20 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 lg:grid lg:overflow-visible">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0 lg:shrink">
                <button type="button" onClick={() => p.setSection(s.id)} aria-current={section === s.id ? "page" : undefined} className={cn("relative flex w-full min-w-40 items-start gap-2 rounded-lg px-3 py-2.5 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-w-0", section === s.id ? "bg-secondary font-semibold text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground")}>
                  <span className="min-w-0 flex-1"><span className="block">{t(s.label)}</span><span className="hidden text-xs font-normal opacity-80 lg:block">{t(s.desc)}</span></span>
                  {dirty[s.id] && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-warning" role="img" aria-label={t("Unsaved changes", "تغييرات غير محفوظة")} />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          <div role="status" aria-live="polite">
            {notice && <p className={cn("flex items-start gap-2 rounded-lg p-3 text-sm", notice.tone === "ok" ? "bg-success-soft text-success-ink" : "bg-danger-soft text-danger-ink")}>{notice.tone === "ok" ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}<span>{notice.text}{notice.sections?.map((sid) => <button key={sid} type="button" className="ms-2 underline" onClick={() => p.setSection(sid)}>{t(SECTIONS.find((x) => x.id === sid)!.label)}</button>)}</span></p>}
          </div>
          <h2 className="sr-only">{t(current.label)}</h2>
          {section === "profile" && <ProfileSection p={p} />}
          {section === "course" && <CourseSection p={p} />}
          {section === "ai" && <AiSection p={p} />}
          {section === "notifications" && <NotificationsSection p={p} />}
          {section === "permissions" && <PermissionsSection p={p} />}
          {section === "language" && <LanguageSection p={p} />}

          <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 p-3 shadow-raised backdrop-blur" role="region" aria-label={t("Save changes", "حفظ التغييرات")}>
            <p className="min-w-0 flex-1 text-sm">{anyDirty ? <span className="flex items-center gap-2 font-medium"><span className="size-2 rounded-full bg-warning" aria-hidden="true" />{t(`Unsaved changes in ${dirtyList.map((s) => s.label[0]).join(", ")}`, `تغييرات غير محفوظة في ${dirtyList.map((s) => s.label[1]).join("، ")}`)}</span> : <span className="text-muted-foreground">{t("All changes saved", "تم حفظ كل التغييرات")}</span>}</p>
            <Button variant="ghost" onClick={() => setConfirm(true)}><RotateCcw aria-hidden="true" />{t("Reset section", "إعادة ضبط القسم")}</Button>
            <Button variant="outline" disabled={!anyDirty} onClick={p.discard}>{t("Discard", "تجاهل")}</Button>
            <Button disabled={!anyDirty} onClick={() => p.save()}>{t("Save changes", "حفظ التغييرات")}</Button>
          </div>
        </div>
      </div>
      <Confirm danger open={confirm} onOpenChange={setConfirm} title={t(`Reset “${current.label[0]}” to defaults?`, `إعادة ضبط «${current.label[1]}» إلى الافتراضي؟`)}
        description={scoped ? t(`This resets ${course.code} only and cannot be undone. Other sections keep their unsaved changes.`, `يعيد هذا ضبط ${course.code} فقط ولا يمكن التراجع عنه. تحتفظ الأقسام الأخرى بتغييراتها غير المحفوظة.`) : t("This restores the default values for this section and cannot be undone. Other sections keep their unsaved changes.", "يستعيد هذا القيم الافتراضية لهذا القسم ولا يمكن التراجع عنه. تحتفظ الأقسام الأخرى بتغييراتها غير المحفوظة.")}
        action={t("Reset", "إعادة ضبط")} onConfirm={() => p.reset(section as SectionId)} />
    </div>
  );
}
