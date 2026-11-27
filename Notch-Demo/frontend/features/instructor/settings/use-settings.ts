"use client";
import { useEffect, useMemo, useState } from "react";
import { useInstructor } from "@/features/instructor/portal/context";
import { useInstructorPortal } from "@/features/instructor/portal/store";
import { useParam } from "@/features/instructor/dashboard/hooks";
import { defaultCourse, defaults, roleFor, roleRank, SECTIONS, type AiCfg, type CourseCfg, type SectionId, type Settings } from "./data";
import { useSettings } from "./store";

const j = (v: unknown) => JSON.stringify(v);

export function useSettingsPage() {
  const inst = useInstructor();
  const id = inst.instructor.id;
  const fallback = useMemo(() => defaults(id), [id]);
  const draft = useSettings((s) => s.draft[id]);
  const savedRaw = useSettings((s) => s.saved[id]);
  const saved = savedRaw ?? fallback;
  const cfg = draft ?? saved;
  const store = useSettings.getState;
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { void Promise.resolve(useSettings.persist.rehydrate()).finally(() => setHydrated(true)); }, []);
  const [sectionRaw, setSection] = useParam("section", "profile");
  const [courseRaw, setCourse] = useParam("course", inst.assigned[0]?.id ?? "python");
  const section = (SECTIONS.some((s) => s.id === sectionRaw) ? sectionRaw : "profile") as SectionId;
  const course = inst.assigned.find((c) => c.id === courseRaw) ?? inst.assigned[0];
  const role = roleFor(id, course.id);
  const rank = roleRank[role];
  const cc = cfg.courses[course.id] ?? defaultCourse(course.id);
  const sc = saved.courses[course.id] ?? defaultCourse(course.id);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string; sections?: SectionId[] } | null>(null);

  const update = (fn: (s: Settings) => Settings) => { store().edit(id, fn); setNotice(null); };
  const setCourseCfg = (patch: Partial<CourseCfg>) => update((s) => { const cur = s.courses[course.id] ?? defaultCourse(course.id); s.courses[course.id] = { ...cur, course: { ...cur.course, ...patch } }; return s; });
  const setAi = (patch: Partial<AiCfg>) => update((s) => { const cur = s.courses[course.id] ?? defaultCourse(course.id); s.courses[course.id] = { ...cur, ai: { ...cur.ai, ...patch } }; return s; });

  const dirty: Record<SectionId, boolean> = {
    profile: j(cfg.profile) !== j(saved.profile),
    course: Object.keys({ ...cfg.courses, ...saved.courses }).some((k) => j((cfg.courses[k] ?? defaultCourse(k)).course) !== j((saved.courses[k] ?? defaultCourse(k)).course)),
    ai: Object.keys({ ...cfg.courses, ...saved.courses }).some((k) => j((cfg.courses[k] ?? defaultCourse(k)).ai) !== j((saved.courses[k] ?? defaultCourse(k)).ai)),
    notifications: j(cfg.notifications) !== j(saved.notifications),
    permissions: j(cfg.team) !== j(saved.team),
    language: j(cfg.language) !== j(saved.language),
  };
  const anyDirty = Object.values(dirty).some(Boolean);

  const validate = (): { section: SectionId; text: string }[] => {
    const e: { section: SectionId; text: string }[] = [];
    const { t } = inst;
    if (!cfg.profile.name[0].trim() || !cfg.profile.name[1].trim()) e.push({ section: "profile", text: t("Enter your name in English and Arabic.", "أدخل اسمك بالإنجليزية والعربية.") });
    for (const c of inst.assigned) {
      const x = cfg.courses[c.id] ?? defaultCourse(c.id);
      if (!x.course.title[0].trim() || !x.course.title[1].trim()) e.push({ section: "course", text: t(`${c.code}: course title cannot be empty.`, `${c.code}: لا يمكن ترك عنوان المقرر فارغًا.`) });
      if (x.course.enrollment.capacity < 1 || x.course.enrollment.capacity > 1000) e.push({ section: "course", text: t(`${c.code}: capacity must be 1–1000.`, `${c.code}: يجب أن تكون السعة بين 1 و1000.`) });
      if (x.ai.sourceMode === "selected" && !x.ai.sources.length) e.push({ section: "ai", text: t(`${c.code}: choose at least one tutor source, or allow all course materials.`, `${c.code}: اختر مصدرًا واحدًا على الأقل للمساعد أو اسمح بكل مواد المقرر.`) });
    }
    return e;
  };
  const save = () => {
    const errors = validate();
    if (errors.length) { setNotice({ tone: "error", text: errors.map((x) => x.text).join(" "), sections: [...new Set(errors.map((x) => x.section))] }); return false; }
    const lang = cfg.language.interface;
    store().save(id);
    if (lang) { useInstructorPortal.getState().setLanguage(lang); store().edit(id, (s) => { s.language.interface = null; return s; }); store().save(id); }
    setNotice({ tone: "ok", text: inst.t("Settings saved.", "تم حفظ الإعدادات.") });
    return true;
  };
  const discard = () => { store().discard(id); setNotice({ tone: "ok", text: inst.t("Unsaved changes discarded.", "تم تجاهل التغييرات غير المحفوظة.") }); };
  const reset = (s: SectionId) => { store().reset(id, s, course.id); setNotice({ tone: "ok", text: inst.t("Section reset to defaults.", "أُعيد ضبط القسم إلى الإعدادات الافتراضية.") }); };
  const request = (perm: Parameters<Settings["requests"]["push"]>[0]["perm"], reason: string) => { store().both(id, (s) => { s.requests.push({ id: `rq-${s.requests.length + 1}-${perm}`, courseId: course.id, perm, reason, status: "pending" }); return s; }); setNotice({ tone: "ok", text: inst.t("Access request sent (demo).", "تم إرسال طلب الوصول (عرض).") }); };
  const cancelRequest = (rid: string) => { store().both(id, (s) => { s.requests = s.requests.filter((r) => r.id !== rid); return s; }); setNotice({ tone: "ok", text: inst.t("Request cancelled.", "تم إلغاء الطلب.") }); };

  return { ...inst, id, cfg, saved, cc, sc, hydrated, section, course, role, rank, dirty, anyDirty, notice, setNotice, update, setCourseCfg, setAi, save, discard, reset, request, cancelRequest, setSection, setCourse };
}
export type Sp = ReturnType<typeof useSettingsPage>;
