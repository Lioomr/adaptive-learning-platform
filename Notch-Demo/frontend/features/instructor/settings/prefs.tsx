"use client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/features/instructor/portal/forms";
import { Notice, Panel, SettingRow, Toggle } from "./controls";
import type { Copy, LangCfg, Notif, NotifKey } from "./data";
import type { Sp } from "./use-settings";

const c2 = (en: string, ar: string): Copy => [en, ar];
const CATS: { id: NotifKey; label: Copy; desc: Copy; critical?: boolean }[] = [
  { id: "approvals", label: c2("Pending approvals", "الاعتمادات المعلّقة"), desc: c2("Concepts, prerequisites and questions waiting for your decision.", "مفاهيم ومتطلبات وأسئلة بانتظار قرارك.") },
  { id: "atRisk", label: c2("Students at risk", "طلاب معرضون للتعثر"), desc: c2("A student meets a risk rule such as long inactivity.", "طالب تنطبق عليه قاعدة خطر مثل الانقطاع الطويل.") },
  { id: "oob", label: c2("Out-of-bound AI tutor questions", "أسئلة المساعد الذكي خارج النطاق"), desc: c2("The tutor declined a question it could not answer from your materials.", "امتنع المساعد عن سؤال لا يمكن الإجابة عنه من موادك.") },
  { id: "submissions", label: c2("Assignment submissions", "تسليمات الواجبات"), desc: c2("Students hand in work.", "يسلّم الطلاب أعمالهم.") },
  { id: "grading", label: c2("Pending grading", "التصحيح المعلّق"), desc: c2("Submitted work is waiting for marks.", "أعمال مسلَّمة بانتظار الدرجات.") },
  { id: "attendance", label: c2("Attendance issues", "مشكلات الحضور"), desc: c2("Unrecorded sessions and repeated absences.", "جلسات غير مسجَّلة وغياب متكرر.") },
  { id: "assessments", label: c2("Upcoming assessments", "التقييمات القادمة"), desc: c2("Quizzes and exams starting soon.", "اختبارات وامتحانات تبدأ قريبًا.") },
  { id: "errors", label: c2("Course processing errors", "أخطاء معالجة المقرر"), desc: c2("An uploaded file failed or could not be indexed.", "فشل ملف مرفوع أو تعذّرت فهرسته."), critical: true },
];

export function NotificationsSection({ p }: { p: Sp }) {
  const { t, cfg, update } = p;
  const n = cfg.notifications;
  const set = (k: NotifKey, patch: Partial<Notif>) => update((s) => { s.notifications.items[k] = { ...s.notifications.items[k], ...patch }; return s; });
  const anySummary = Object.values(n.items).some((x) => x.mode === "summary");
  return (
    <div className="space-y-6">
      <Panel title={t("Delivery", "التسليم")}>
        <SettingRow label={t("Email notifications", "إشعارات البريد الإلكتروني")} description={t("Turn email off to receive in-app notifications only. (Demo: no email is actually sent.)", "أوقف البريد لتلقي الإشعارات داخل التطبيق فقط. (عرض: لا يُرسل بريد فعليًا.)")}><Toggle checked={n.emailEnabled} label={t("Email notifications", "إشعارات البريد الإلكتروني")} onChange={(v) => update((s) => { s.notifications.emailEnabled = v; return s; })} /></SettingRow>
        <SettingRow label={t("Summary frequency", "وتيرة الملخص")} description={t("How often “Summary” notifications are bundled into one message.", "كم مرة تُجمع إشعارات «الملخص» في رسالة واحدة.")} htmlFor="n-freq"><NativeSelect id="n-freq" value={n.frequency} onChange={(e) => update((s) => { s.notifications.frequency = e.target.value as "daily" | "weekly"; return s; })}><option value="daily">{t("Daily, 08:00", "يوميًا، 08:00")}</option><option value="weekly">{t("Weekly, Sunday 08:00", "أسبوعيًا، الأحد 08:00")}</option></NativeSelect></SettingRow>
      </Panel>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-start text-sm">
          <caption className="p-4 pb-2 text-start text-base font-semibold">{t("Notification categories", "فئات الإشعارات")}</caption>
          <thead className="bg-muted/60"><tr>{[t("Category", "الفئة"), t("In-app", "داخل التطبيق"), t("Email", "البريد"), t("Delivery", "التسليم")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>{CATS.map((c) => { const x = n.items[c.id]; const off = !x.inApp && !(x.email && n.emailEnabled); return (
            <tr key={c.id} className="border-t align-top">
              <th scope="row" className="p-3 text-start font-medium">{t(c.label)}{off && <Badge tone="warning" className="ms-2">{t("Off", "متوقف")}</Badge>}<span className="block text-xs font-normal text-muted-foreground">{t(c.desc)}</span></th>
              <td className="p-3"><Toggle checked={x.inApp} label={t(`In-app: ${c.label[0]}`, `داخل التطبيق: ${c.label[1]}`)} onChange={(v) => set(c.id, { inApp: v })} /></td>
              <td className="p-3"><Toggle checked={x.email && n.emailEnabled} disabled={!n.emailEnabled} label={t(`Email: ${c.label[0]}`, `البريد: ${c.label[1]}`)} onChange={(v) => set(c.id, { email: v })} /></td>
              <td className="p-3"><NativeSelect aria-label={t(`Delivery: ${c.label[0]}`, `التسليم: ${c.label[1]}`)} className="h-10 w-44" disabled={off} value={x.mode} onChange={(e) => set(c.id, { mode: e.target.value as Notif["mode"] })}><option value="immediate">{t("Immediate", "فوري")}</option><option value="summary">{t("Summary", "ملخص")}</option></NativeSelect></td>
            </tr>); })}</tbody>
        </table>
      </Card>
      {!n.items.errors.inApp && !n.items.errors.email && <Notice tone="warning">{t("Course processing errors are off. A failed upload could go unnoticed and the AI tutor would lack that material.", "أخطاء المعالجة متوقفة. قد يمر فشل الرفع دون ملاحظة وسيفتقد المساعد تلك المادة.")}</Notice>}
      {!n.items.oob.inApp && !n.items.oob.email && <Notice tone="warning">{t("Out-of-bound tutor questions are off. They still appear on the review page, but you will not be alerted.", "أسئلة المساعد خارج النطاق متوقفة. ما زالت تظهر في صفحة المراجعة لكنك لن تُنبَّه.")}</Notice>}
      {anySummary && <Notice>{t(`Summary notifications are bundled ${n.frequency === "daily" ? "once a day" : "once a week"}.`, `تُجمع إشعارات الملخص ${n.frequency === "daily" ? "مرة يوميًا" : "مرة أسبوعيًا"}.`)}</Notice>}
    </div>
  );
}

export function LanguageSection({ p }: { p: Sp }) {
  const { t, cfg, update, language } = p;
  const l = cfg.language;
  const set = (patch: Partial<LangCfg>) => update((s) => { s.language = { ...s.language, ...patch }; return s; });
  const effLang = l.interface ?? language;
  const effDir = l.direction === "auto" ? (effLang === "ar" ? "rtl" : "ltr") : l.direction;
  return (
    <div className="space-y-6">
      <Panel title={t("Language", "اللغة")}>
        <SettingRow label={t("Interface language", "لغة الواجهة")} description={t("Arabic or English display. Arabic switches the whole interface to right-to-left.", "عرض بالعربية أو الإنجليزية. تحوّل العربية الواجهة كلها إلى الاتجاه من اليمين إلى اليسار.")} htmlFor="l-ui"><NativeSelect id="l-ui" value={l.interface ?? language} onChange={(e) => set({ interface: e.target.value === language ? null : (e.target.value as "en" | "ar") })}><option value="en">English</option><option value="ar">العربية</option></NativeSelect></SettingRow>
        <SettingRow label={t("Preferred content language", "لغة المحتوى المفضلة")} description={t("Which language to show first for bilingual content such as course titles and announcements.", "اللغة التي تُعرض أولًا للمحتوى ثنائي اللغة مثل عناوين المقررات والإعلانات.")} htmlFor="l-ct"><NativeSelect id="l-ct" value={l.content} onChange={(e) => set({ content: e.target.value as LangCfg["content"] })}><option value="ui">{t("Same as the interface", "مثل الواجهة")}</option><option value="en">{t("English first", "الإنجليزية أولًا")}</option><option value="ar">{t("Arabic first", "العربية أولًا")}</option><option value="both">{t("Show both", "إظهار الاثنتين")}</option></NativeSelect></SettingRow>
        <SettingRow label={t("Layout direction", "اتجاه التخطيط")} description={t("“Follow language” is recommended: Arabic is right-to-left and English is left-to-right. Forcing a direction can make some screens look mirrored incorrectly.", "«حسب اللغة» موصى به: العربية من اليمين إلى اليسار والإنجليزية من اليسار إلى اليمين. قد يجعل فرض اتجاه بعض الشاشات تبدو معكوسة بشكل غير صحيح.")} htmlFor="l-dir"><NativeSelect id="l-dir" value={l.direction} onChange={(e) => set({ direction: e.target.value as LangCfg["direction"] })}><option value="auto">{t("Follow language (recommended)", "حسب اللغة (موصى به)")}</option><option value="rtl">{t("Always right-to-left", "دائمًا من اليمين إلى اليسار")}</option><option value="ltr">{t("Always left-to-right", "دائمًا من اليسار إلى اليمين")}</option></NativeSelect></SettingRow>
      </Panel>
      <Panel title={t("Accessibility", "سهولة الوصول")}>
        <SettingRow label={t("Text size", "حجم النص")} description={t("Scales text across the instructor portal.", "يكبّر النص في بوابة المدرّس.")} htmlFor="l-size"><NativeSelect id="l-size" value={l.textSize} onChange={(e) => set({ textSize: Number(e.target.value) as LangCfg["textSize"] })}><option value={100}>{t("Default", "افتراضي")}</option><option value={112}>{t("Large", "كبير")}</option><option value={125}>{t("Extra large", "كبير جدًا")}</option></NativeSelect></SettingRow>
        <SettingRow label={t("Reduce motion", "تقليل الحركة")} description={t("Turns off animations and smooth transitions.", "يوقف الرسوم المتحركة والانتقالات.")}><Toggle checked={l.reduceMotion} label={t("Reduce motion", "تقليل الحركة")} onChange={(v) => set({ reduceMotion: v })} /></SettingRow>
        <SettingRow label={t("Underline links", "تسطير الروابط")} description={t("Makes links easier to spot without relying on colour.", "يسهّل تمييز الروابط دون الاعتماد على اللون.")}><Toggle checked={l.underlineLinks} label={t("Underline links", "تسطير الروابط")} onChange={(v) => set({ underlineLinks: v })} /></SettingRow>
      </Panel>
      <Card className="p-5" dir={effDir} lang={effLang}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground" dir="auto">{t("Preview of your choices", "معاينة اختياراتك")}</p>
        <p className="font-medium" style={{ fontSize: `${l.textSize}%` }}>{effLang === "ar" ? "مرحبًا د. هناء — لديك ٣ اعتمادات معلّقة و٢ من الطلاب المعرضين للتعثر." : "Hello Dr. Hana — you have 3 pending approvals and 2 students at risk."}</p>
        <p className="mt-2 text-sm text-muted-foreground" style={{ fontSize: `${l.textSize * 0.875}%` }}>{effLang === "ar" ? "هذه الفقرة تعرض اتجاه النص وحجمه حسب إعداداتك. " : "This line shows direction and size as you chose. "}<a href="#preview" onClick={(e) => e.preventDefault()} className={l.underlineLinks ? "underline underline-offset-4" : "text-primary"}>{effLang === "ar" ? "رابط تجريبي" : "Sample link"}</a></p>
      </Card>
      <Notice>{t("Interface language and layout apply when you save. Text size, motion and link settings are saved per instructor in this browser.", "تُطبَّق لغة الواجهة والتخطيط عند الحفظ. تُحفظ إعدادات حجم النص والحركة والروابط لكل مدرّس في هذا المتصفح.")}</Notice>
    </div>
  );
}
