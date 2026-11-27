"use client";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, TextArea, TextInput, editCopy } from "@/features/instructor/portal/forms";
import { Notice, Panel, SettingRow, Toggle } from "./controls";
import { RequestAccess } from "./permissions";
import { TERMS, grantedBy, roleLabel, type AiCfg, type CourseCfg } from "./data";
import type { Sp } from "./use-settings";

export function CoursePicker({ p }: { p: Sp }) {
  const { t, assigned, course, role, cc } = p;
  const live = cc.course.visibility !== "hidden";
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
      <label className="grid min-w-64 flex-1 gap-1 text-xs text-muted-foreground">{t("Course", "المقرر")}
        <NativeSelect value={course.id} onChange={(e) => p.setCourse(e.target.value)}>{assigned.map((c) => <option key={c.id} value={c.id}>{c.code} · {t(c.title)}</option>)}</NativeSelect></label>
      <div className="flex flex-wrap items-center gap-2 pb-1 text-sm">
        <span className="text-muted-foreground">{t("Status", "الحالة")}</span><Badge tone={live ? "success" : "neutral"}>{live ? t("Live for students", "ظاهر للطلاب") : t("Hidden (draft)", "مخفي (مسودة)")}</Badge>
        <span className="ms-2 text-muted-foreground">{t("Your role", "دورك")}</span><Badge tone="brand">{t(roleLabel[role])}</Badge>
      </div>
    </div>
  );
}

function Restriction({ p, need }: { p: Sp; need: "coordinator" | "instructor" }) {
  const { t, rank, role } = p;
  const needRank = need === "coordinator" ? 2 : 1;
  if (rank >= needRank) return null;
  return (
    <Notice tone="warning">
      {t(`Your role (${roleLabel[role][0]}) can view these settings but not change them. Changes need a ${roleLabel[need][0]}; ask ${grantedBy[role][0]}.`, `دورك (${roleLabel[role][1]}) يتيح لك عرض هذه الإعدادات دون تغييرها. التغيير يحتاج ${roleLabel[need][1]}؛ اطلب من ${grantedBy[role][1]}.`)}
      <span className="ms-2 inline-block"><RequestAccess p={p} perm="settings" /></span>
    </Notice>
  );
}

export function CourseSection({ p }: { p: Sp }) {
  const { t, num, language, cc, rank, setCourseCfg } = p;
  const c = cc.course;
  const coord = rank >= 2, instr = rank >= 1;
  const lockHint = (ok: boolean, need: string, needAr: string) => (ok ? undefined : t(`Requires ${need}.`, `يتطلب ${needAr}.`));
  const i = language === "ar" ? 1 : 0;
  return (
    <div className="space-y-6">
      <CoursePicker p={p} />
      <Restriction p={p} need="coordinator" />
      <Panel title={t("Course details", "تفاصيل المقرر")}>
        <SettingRow label={t("Course title", "عنوان المقرر")} description={lockHint(coord, "a Course Coordinator", "منسّق المقرر")} locked={!coord} htmlFor="c-title"><TextInput id="c-title" disabled={!coord} maxLength={100} value={c.title[i]} onChange={(e) => setCourseCfg({ title: editCopy(c.title, language, e.target.value) })} /></SettingRow>
        <SettingRow label={t("Description", "الوصف")} description={lockHint(instr, "a Course Instructor", "مدرّس المقرر")} locked={!instr} htmlFor="c-desc"><TextArea id="c-desc" disabled={!instr} rows={3} maxLength={400} value={c.description[i]} onChange={(e) => setCourseCfg({ description: editCopy(c.description, language, e.target.value) })} /></SettingRow>
        <SettingRow label={t("Academic term", "الفصل الأكاديمي")} description={lockHint(coord, "a Course Coordinator", "منسّق المقرر")} locked={!coord} htmlFor="c-term"><NativeSelect id="c-term" disabled={!coord} value={c.term} onChange={(e) => setCourseCfg({ term: e.target.value })}>{TERMS.map((x) => <option key={x.id} value={x.id}>{t(x.label)}</option>)}</NativeSelect></SettingRow>
      </Panel>
      <Panel title={t("Languages", "اللغات")}>
        <SettingRow label={t("Course language", "لغة المقرر")} description={t("The language the course is taught and written in.", "اللغة التي يُدرَّس بها المقرر ويُكتب.")} locked={!instr} htmlFor="c-lang"><NativeSelect id="c-lang" disabled={!instr} value={c.language} onChange={(e) => setCourseCfg({ language: e.target.value as CourseCfg["language"] })}><option value="en">{t("English", "الإنجليزية")}</option><option value="ar">{t("Arabic", "العربية")}</option><option value="both">{t("Bilingual (English and Arabic)", "ثنائي اللغة (الإنجليزية والعربية)")}</option></NativeSelect></SettingRow>
        <SettingRow label={t("Default student language", "لغة الطالب الافتراضية")} description={t("What students see first. Each student can switch it for themselves.", "ما يراه الطلاب أولًا. يمكن لكل طالب تغييرها لنفسه.")} locked={!instr} htmlFor="c-slang"><NativeSelect id="c-slang" disabled={!instr} value={c.studentLanguage} onChange={(e) => setCourseCfg({ studentLanguage: e.target.value as CourseCfg["studentLanguage"] })}><option value="auto">{t("Follow each student's preference", "حسب تفضيل كل طالب")}</option><option value="en">{t("English", "الإنجليزية")}</option><option value="ar">{t("Arabic", "العربية")}</option></NativeSelect></SettingRow>
      </Panel>
      <Panel title={t("Visibility and enrollment", "الظهور والتسجيل")}>
        <SettingRow label={t("Course visibility", "ظهور المقرر")} description={t("Hidden courses are only visible to the teaching team.", "المقررات المخفية يراها فريق التدريس فقط.") + " " + (lockHint(coord, "a Course Coordinator", "منسّق المقرر") ?? "")} locked={!coord} htmlFor="c-vis"><NativeSelect id="c-vis" disabled={!coord} value={c.visibility} onChange={(e) => setCourseCfg({ visibility: e.target.value as CourseCfg["visibility"] })}><option value="hidden">{t("Hidden (draft)", "مخفي (مسودة)")}</option><option value="enrolled">{t("Enrolled students only", "الطلاب المسجلون فقط")}</option><option value="catalogue">{t("Listed in the course catalogue", "مدرج في كتالوج المقررات")}</option></NativeSelect></SettingRow>
        <SettingRow label={t("Enrollment", "التسجيل")} description={lockHint(coord, "a Course Coordinator", "منسّق المقرر")} locked={!coord} htmlFor="c-enr"><NativeSelect id="c-enr" disabled={!coord} value={c.enrollment.mode} onChange={(e) => setCourseCfg({ enrollment: { ...c.enrollment, mode: e.target.value as CourseCfg["enrollment"]["mode"] } })}><option value="open">{t("Open: students join directly", "مفتوح: ينضم الطلاب مباشرة")}</option><option value="approval">{t("By approval", "بموافقة")}</option><option value="closed">{t("Closed", "مغلق")}</option></NativeSelect></SettingRow>
        <SettingRow label={t("Enrollment capacity", "سعة التسجيل")} locked={!coord} htmlFor="c-cap"><TextInput id="c-cap" type="number" min={1} max={1000} disabled={!coord} value={c.enrollment.capacity} onChange={(e) => setCourseCfg({ enrollment: { ...c.enrollment, capacity: Number(e.target.value) } })} /></SettingRow>
      </Panel>
      <Panel title={t("Course completion", "إنجاز المقرر")} description={t("When a student counts as having completed the course. This is separate from grades.", "متى يُعدّ الطالب مكملًا للمقرر. هذا منفصل عن الدرجات.")}>
        <SettingRow label={t(`Lectures and labs completed: ${c.completion.pct}%`, `المحاضرات والمعامل المكتملة: ${num(c.completion.pct)}٪`)} locked={!instr} htmlFor="c-pct"><input id="c-pct" type="range" min={50} max={100} step={5} disabled={!instr} value={c.completion.pct} onChange={(e) => setCourseCfg({ completion: { ...c.completion, pct: Number(e.target.value) } })} className="w-full accent-[var(--color-primary)]" aria-valuetext={`${c.completion.pct}%`} /></SettingRow>
        <SettingRow label={t("Labs must be completed", "يجب إكمال المعامل")} locked={!instr}><Toggle disabled={!instr} checked={c.completion.requireLabs} label={t("Labs must be completed", "يجب إكمال المعامل")} onChange={(v) => setCourseCfg({ completion: { ...c.completion, requireLabs: v } })} /></SettingRow>
        <SettingRow label={t("Final assessment must be taken", "يجب أداء التقييم النهائي")} locked={!instr}><Toggle disabled={!instr} checked={c.completion.requireFinal} label={t("Final assessment must be taken", "يجب أداء التقييم النهائي")} onChange={(v) => setCourseCfg({ completion: { ...c.completion, requireFinal: v } })} /></SettingRow>
      </Panel>
    </div>
  );
}

export function AiSection({ p }: { p: Sp }) {
  const { t, num, pick, cc, rank, setAi, content, course } = p;
  const a = cc.ai;
  const can = rank >= 1;
  const sources = [
    ...content.materials.filter((m) => m.courseId === course.id).map((m) => ({ id: m.id, label: pick(m.title), kind: t("Material", "مادة") })),
    ...content.lessons.filter((l) => l.courseId === course.id && l.status === "published").map((l) => ({ id: l.id, label: pick(l.title), kind: l.kind === "lab" ? t("Lab", "معمل") : t("Lecture", "محاضرة") })),
  ];
  const strict = { flexible: t("Students can open any concept. The tutor only points out weak prerequisites.", "يمكن للطلاب فتح أي مفهوم. يكتفي المساعد بالإشارة إلى المتطلبات الضعيفة."), balanced: t("Students are warned and offered a review, but can continue.", "يُحذَّر الطلاب ويُعرض عليهم مراجعة، لكن يمكنهم المتابعة."), strict: t("A concept stays locked until its prerequisites reach the mastery threshold.", "يبقى المفهوم مقفلًا حتى تبلغ متطلباته عتبة الإتقان.") }[a.strictness];
  const toggleSource = (id: string) => setAi({ sources: a.sources.includes(id) ? a.sources.filter((x) => x !== id) : [...a.sources, id] });
  return (
    <div className="space-y-6">
      <CoursePicker p={p} />
      {!can && <Notice tone="warning">{t(`Your role (${roleLabel[p.role][0]}) can view the learning and AI settings but not change them. Ask ${grantedBy[p.role][0]}.`, `دورك (${roleLabel[p.role][1]}) يتيح عرض إعدادات التعلم والذكاء الاصطناعي دون تغييرها. اطلب من ${grantedBy[p.role][1]}.`)}<span className="ms-2 inline-block"><RequestAccess p={p} perm="settings" /></span></Notice>}
      <Notice>{t("The AI tutor is designed to answer only from the materials you permit, and to decline or flag a question it cannot answer reliably. No setting can guarantee it is never wrong, so flagged questions reach your dashboard for review. Mastery figures are estimates from practice and are separate from official grades.", "صُمِّم المساعد الذكي ليجيب من المواد التي تسمح بها فقط، وليمتنع عن السؤال أو يُبلّغ عنه إن تعذّرت إجابة موثوقة. لا يوجد إعداد يضمن ألا يخطئ أبدًا، لذلك تصل الأسئلة المُبلَّغ عنها إلى لوحتك للمراجعة. أرقام الإتقان تقديرات من التدريب وهي منفصلة عن الدرجات الرسمية.")}</Notice>
      <Panel title={t("Mastery and prerequisites", "الإتقان والمتطلبات")}>
        <SettingRow label={t(`Mastery threshold: ${a.threshold}%`, `عتبة الإتقان: ${num(a.threshold)}٪`)} description={t("The estimated mastery at which a concept counts as mastered. Higher means students practise more before moving on. It is not a grade.", "الإتقان التقديري الذي يُعدّ عنده المفهوم متقنًا. كلما ارتفع زاد تدريب الطلاب قبل المتابعة. ليس درجة.")} locked={!can} htmlFor="a-thr" stack><input id="a-thr" type="range" min={50} max={90} step={5} disabled={!can} value={a.threshold} onChange={(e) => setAi({ threshold: Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" aria-valuetext={`${a.threshold}%`} /></SettingRow>
        <SettingRow label={t("Prerequisite strictness", "صرامة المتطلبات")} description={strict} locked={!can} htmlFor="a-str"><NativeSelect id="a-str" disabled={!can} value={a.strictness} onChange={(e) => setAi({ strictness: e.target.value as AiCfg["strictness"] })}><option value="flexible">{t("Flexible", "مرنة")}</option><option value="balanced">{t("Balanced (recommended)", "متوازنة (موصى بها)")}</option><option value="strict">{t("Strict", "صارمة")}</option></NativeSelect></SettingRow>
        <SettingRow label={t("Recommend prerequisite remediation", "التوصية بعلاج المتطلبات")} description={t("When a student struggles, suggest practice on the weak prerequisite first.", "عند تعثر الطالب، اقترح التدريب على المتطلب الضعيف أولًا.")} locked={!can}><Toggle disabled={!can} checked={a.remediation} label={t("Recommend prerequisite remediation", "التوصية بعلاج المتطلبات")} onChange={(v) => setAi({ remediation: v })} /></SettingRow>
        <SettingRow label={t("Adaptive practice", "التدريب التكيّفي")} description={t("Practice questions chosen from each student's mastery estimate.", "أسئلة تدريب تُختار حسب تقدير إتقان كل طالب.")} locked={!can} htmlFor="a-ad"><NativeSelect id="a-ad" disabled={!can} value={a.adaptive} onChange={(e) => setAi({ adaptive: e.target.value as AiCfg["adaptive"] })}><option value="on">{t("Available", "متاح")}</option><option value="after-lecture">{t("Only after the lecture is published", "بعد نشر المحاضرة فقط")}</option><option value="off">{t("Off", "متوقف")}</option></NativeSelect></SettingRow>
        <SettingRow label={t("Student visibility of mastery", "ظهور الإتقان للطلاب")} description={t("What students see about their own mastery estimates. They are labelled as estimates, not grades.", "ما يراه الطلاب عن تقديرات إتقانهم. تُوسم بأنها تقديرات وليست درجات.")} locked={!can} htmlFor="a-vis"><NativeSelect id="a-vis" disabled={!can} value={a.masteryVisibility} onChange={(e) => setAi({ masteryVisibility: e.target.value as AiCfg["masteryVisibility"] })}><option value="hidden">{t("Hidden", "مخفي")}</option><option value="concepts">{t("Concept level only", "على مستوى المفهوم فقط")}</option><option value="detail">{t("Full detail", "كامل التفاصيل")}</option></NativeSelect></SettingRow>
      </Panel>
      <Panel title={t("AI tutor", "المساعد الذكي")}>
        <SettingRow label={t("Answers only from permitted materials", "الإجابة من المواد المسموح بها فقط")} description={t("Always on. The tutor never answers from outside the sources below.", "مفعّل دائمًا. لا يجيب المساعد أبدًا من خارج المصادر أدناه.")} locked><Toggle checked disabled label={t("Answers only from permitted materials", "الإجابة من المواد المسموح بها فقط")} onChange={() => undefined} /></SettingRow>
        <SettingRow label={t("Tutor response language", "لغة رد المساعد")} locked={!can} htmlFor="a-tl"><NativeSelect id="a-tl" disabled={!can} value={a.tutorLang} onChange={(e) => setAi({ tutorLang: e.target.value as AiCfg["tutorLang"] })}><option value="match">{t("Match the student's question", "مطابقة لغة سؤال الطالب")}</option><option value="en">{t("English", "الإنجليزية")}</option><option value="ar">{t("Arabic", "العربية")}</option><option value="both">{t("Both languages", "اللغتان معًا")}</option></NativeSelect></SettingRow>
        <SettingRow label={t("When the answer is not in the materials", "عندما لا تكون الإجابة في المواد")} description={t("The tutor always declines. This chooses what happens next.", "يمتنع المساعد دائمًا. يحدد هذا ما يحدث بعد ذلك.")} locked={!can} htmlFor="a-un"><NativeSelect id="a-un" disabled={!can} value={a.unavailable} onChange={(e) => setAi({ unavailable: e.target.value as AiCfg["unavailable"] })}><option value="flag">{t("Decline and flag for my review (recommended)", "الامتناع والإبلاغ لمراجعتي (موصى به)")}</option><option value="suggest">{t("Decline and suggest related materials", "الامتناع واقتراح مواد ذات صلة")}</option><option value="abstain">{t("Decline only", "الامتناع فقط")}</option></NativeSelect></SettingRow>
        {a.unavailable === "abstain" && <div className="pt-4"><Notice tone="warning">{t("Declined questions will not be flagged, so you will not see what students could not get answered.", "لن يُبلَّغ عن الأسئلة المرفوضة، فلن ترى ما لم يستطع الطلاب الحصول على إجابته.")}</Notice></div>}
        <SettingRow stack label={t("Permitted source materials", "المواد المصدرية المسموح بها")} description={t("What the tutor may use to answer. Anything not listed is out of bounds.", "ما يجوز للمساعد استخدامه للإجابة. أي شيء غير مدرج خارج النطاق.")} locked={!can}>
          <div role="radiogroup" aria-label={t("Source mode", "نمط المصادر")} className="mb-3 flex flex-wrap gap-2">{([["all", t("All published course materials", "كل مواد المقرر المنشورة")], ["selected", t("Only the ones I choose", "التي أختارها فقط")]] as const).map(([v, l]) => <label key={v} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm"><input type="radio" name="src" className="size-4 accent-[var(--color-primary)]" disabled={!can} checked={a.sourceMode === v} onChange={() => setAi({ sourceMode: v })} />{l}</label>)}</div>
          {a.sourceMode === "selected" && (sources.length ? <ul className="grid gap-2 sm:grid-cols-2">{sources.map((s) => <li key={s.id}><label className="flex items-center gap-2 rounded-lg border p-2.5 text-sm"><input type="checkbox" className="size-4 accent-[var(--color-primary)]" disabled={!can} checked={a.sources.includes(s.id)} onChange={() => toggleSource(s.id)} /><span className="flex-1">{s.label}</span><Badge tone="neutral">{s.kind}</Badge></label></li>)}</ul> : <p className="text-sm text-muted-foreground">{t("This course has no published materials yet.", "لا مواد منشورة لهذا المقرر بعد.")}</p>)}
        </SettingRow>
      </Panel>
    </div>
  );
}
