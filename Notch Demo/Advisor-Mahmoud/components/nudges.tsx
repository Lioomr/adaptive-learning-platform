"use client";
import {
  useState,
  useRef,
  useRouter,
  Send,
  Check,
  type FormEvent,
} from "@/features/advisor/runtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useDemo } from "@/store/demo";
import type { Student, CourseId } from "@/types";
import type { Language } from "../services/advisor";
import { templates, nameOf } from "../services/language";
import { useAdvisorLocale } from "./advisor-layout";
import { Heading, Panel, StudentLink } from "./common";
import styles from "./advisor.module.css";
export function Nudges({
  student,
  students,
}: {
  student: Student;
  students: Student[];
}) {
  const { t, lang } = useAdvisorLocale();
  const router = useRouter();
  const [template, setTemplate] = useState(0);
  const [messageLang, setMessageLang] = useState<Language>(lang);
  const [course, setCourse] = useState<CourseId | "all">("all");
  const makeText = (index: number, language: Language) =>
    templates[index].text[language].replace(
      "{name}",
      nameOf(student.name, language),
    );
  const [message, setMessage] = useState(() => makeText(0, lang));
  const [preview, setPreview] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [replace, setReplace] = useState<{
    index: number;
    language: Language;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [dialog, setDialog] = useState(false);
  const submission = useRef("");
  const nudges = useDemo((s) => s.nudges)
    .filter((n) => n.studentId === student.id)
    .slice()
    .reverse();
  function updateTemplate(index: number, language: Language) {
    if (dirty) {
      setReplace({ index, language });
      return;
    }
    applyTemplate(index, language);
  }
  function applyTemplate(index: number, language: Language) {
    setTemplate(index);
    setMessageLang(language);
    setMessage(makeText(index, language));
    setDirty(false);
    setPreview(false);
    setSuccess(false);
    setReplace(null);
  }
  function review(e: FormEvent) {
    e.preventDefault();
    setSuccess(false);
    if (!message.trim() || message.trim().length > 1000) {
      setError(
        t(
          "Enter a message between 1 and 1,000 characters.",
          "أدخل رسالة من حرف واحد إلى ١٠٠٠ حرف.",
        ),
      );
      return;
    }
    setError("");
    submission.current = crypto.randomUUID();
    setPreview(true);
  }
  function send() {
    const result = useDemo.getState().sendNudge(
      {
        id: submission.current,
        studentId: student.id,
        courseId: course,
        language: messageLang,
        message,
      },
      "advisor",
    );
    if (result.ok) {
      setSuccess(true);
      setPreview(false);
      setDirty(false);
    } else
      setError(
        t(
          "Could not record this nudge. Check the recipient and message, then preview again.",
          "تعذر تسجيل الرسالة. تحقق من المستلم والنص ثم عاين مجدداً.",
        ),
      );
  }
  return (
    <>
      <Heading
        id="AD4"
        title={t(
          "A thoughtful nudge goes a long way.",
          "رسالة دعم باهتمام تصنع فرقاً.",
        )}
        description={t(
          "Start with a template, make it personal and preview before recording.",
          "ابدأ بقالب، وعدّل الرسالة، ثم عاينها قبل التسجيل.",
        )}
        action={
          <StudentLink student={student}>
            {t("Back to student", "العودة إلى الطالب")}
          </StudentLink>
        }
      />
      <div className={styles.info}>
        <Send size={20} aria-hidden="true" />
        <div>
          <strong>
            {t(
              "Demo only — no notification will be sent",
              "محاكاة فقط — لن يُرسل إشعار فعلي",
            )}
          </strong>
          <p>
            {t(
              "Nudges are recorded in the shared demo activity log for this session. Reload or demo reset clears them.",
              "تُسجل الرسائل في سجل نشاط المحاكاة المشترك لهذه الجلسة. يمسحها إعادة التحميل أو الضبط.",
            )}
          </p>
        </div>
      </div>
      {success && (
        <div className={styles.success} role="status">
          <Check size={20} aria-hidden="true" />
          <div>
            <strong>
              {t(
                "Nudge recorded in demo history",
                "تم تسجيل الرسالة في سجل المحاكاة",
              )}
            </strong>
            <p>
              {t(
                "No message was delivered. You can inspect it below or in the student’s activity history.",
                "لم تُرسل رسالة فعلية. يمكنك فحصها أدناه أو في سجل الطالب.",
              )}
            </p>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.twoColumns}>
        <Panel
          title={t("Compose a nudge", "كتابة رسالة دعم")}
          description={t(
            "A supportive invitation, in your own words.",
            "دعوة داعمة بكلماتك.",
          )}
        >
          <form onSubmit={review} className={styles.form}>
            <label>
              {t("Recipient", "المستلم")}
              <select
                aria-label={t("Recipient", "المستلم")}
                value={student.id}
                onChange={(e) =>
                  router.push(
                    `/advisor/ad4?student=${encodeURIComponent(e.target.value)}`,
                  )
                }
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {nameOf(s.name, lang)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Course context", "سياق المقرر")}
              <select
                aria-label={t("Course context", "سياق المقرر")}
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value as CourseId | "all");
                  setPreview(false);
                  setSuccess(false);
                }}
              >
                {["all", ...student.enrolledCourseIds].map((id) => (
                  <option key={id} value={id}>
                    {nameOf(id, lang)}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.twoColumns}>
              <label>
                {t("Template", "القالب")}
                <select
                  aria-label={t("Template", "القالب")}
                  value={template}
                  onChange={(e) =>
                    updateTemplate(Number(e.target.value), messageLang)
                  }
                >
                  {templates.map((item, i) => (
                    <option key={item.id} value={i}>
                      {item[lang]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("Message language", "لغة الرسالة")}
                <select
                  aria-label={t("Message language", "لغة الرسالة")}
                  value={messageLang}
                  onChange={(e) =>
                    updateTemplate(template, e.target.value as Language)
                  }
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </label>
            </div>
            <label>
              {t("Message", "الرسالة")}
              <textarea
                aria-label={t("Message", "الرسالة")}
                required
                maxLength={1000}
                rows={7}
                value={message}
                dir={messageLang === "ar" ? "rtl" : "ltr"}
                lang={messageLang}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setDirty(true);
                  setPreview(false);
                  setSuccess(false);
                }}
                aria-describedby="message-hint"
              />
            </label>
            <small id="message-hint">
              {message.length}/1000 ·{" "}
              {t(
                "Use fictional demo information only.",
                "استخدم معلومات افتراضية فقط.",
              )}
            </small>
            <Button type="submit" disabled={!message.trim()}>
              {t("Preview nudge", "معاينة الرسالة")}
            </Button>
          </form>
        </Panel>
        <Panel
          title={t("Message preview", "معاينة الرسالة")}
          description={t(
            "Review the exact recipient, course and text.",
            "راجع المستلم والمقرر والنص بدقة.",
          )}
        >
          {preview ? (
            <div className={styles.preview}>
              <Badge tone="ai">{t("Simulated preview", "معاينة محاكاة")}</Badge>
              <h3>{nameOf(student.name, lang)}</h3>
              <p>
                {nameOf(course, lang)} ·{" "}
                {messageLang === "ar" ? "العربية" : "English"}
              </p>
              <blockquote
                dir={messageLang === "ar" ? "rtl" : "ltr"}
                lang={messageLang}
              >
                {message.trim()}
              </blockquote>
              <Button onClick={() => setDialog(true)}>
                <Send aria-hidden="true" />
                {t("Send nudge (simulated)", "إرسال الرسالة (محاكاة)")}
              </Button>
            </div>
          ) : (
            <div className={styles.empty}>
              <Send size={28} aria-hidden="true" />
              <h3>
                {t("Your preview will appear here", "ستظهر المعاينة هنا")}
              </h3>
              <p>
                {t(
                  "Complete your message and choose Preview nudge. Any edit requires a fresh preview.",
                  "أكمل رسالتك ثم اختر المعاينة. يتطلب أي تعديل معاينة جديدة.",
                )}
              </p>
            </div>
          )}
        </Panel>
      </div>
      <Panel
        title={t("Interaction history", "سجل التفاعل")}
        description={t(
          "For this recipient · current session only",
          "لهذا المستلم · الجلسة الحالية فقط",
        )}
      >
        {nudges.length ? (
          <ul className={styles.timeline}>
            {nudges.map((n) => (
              <li key={n.id}>
                <Badge tone="success">
                  {t("Recorded · not delivered", "مسجلة · غير مرسلة فعلياً")}
                </Badge>
                <p dir={n.language === "ar" ? "rtl" : "ltr"}>{n.message}</p>
                <small>
                  {nameOf(n.courseId, lang)} ·{" "}
                  {new Date(n.createdAt).toLocaleString(lang)}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>
            {t(
              "No nudges recorded for this student yet.",
              "لا توجد رسائل مسجلة لهذا الطالب.",
            )}
          </p>
        )}
      </Panel>
      <AlertDialog open={dialog} onOpenChange={setDialog}>
        <AlertDialogContent dir={lang === "ar" ? "rtl" : "ltr"}>
          <AlertDialogTitle>
            {t("Record this simulated nudge?", "تسجيل رسالة المحاكاة؟")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              `Record a nudge for ${student.name} in this session’s demo history. No real message or notification will be sent.`,
              `سجّل رسالة للطالب ${nameOf(student.name, lang)} في سجل هذه الجلسة. لن تُرسل رسالة أو إشعار فعلي.`,
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction onClick={send}>
              {t("Confirm simulated send", "تأكيد إرسال المحاكاة")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={replace !== null}
        onOpenChange={(open) => {
          if (!open) setReplace(null);
        }}
      >
        <AlertDialogContent dir={lang === "ar" ? "rtl" : "ltr"}>
          <AlertDialogTitle>
            {t("Replace your edited message?", "استبدال رسالتك المعدّلة؟")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "Changing the template or language replaces your draft. Your current edits will be lost.",
              "تغيير القالب أو اللغة يستبدل المسودة. ستفقد التعديلات الحالية.",
            )}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("Keep my draft", "الاحتفاظ بالمسودة")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (replace) applyTemplate(replace.index, replace.language);
              }}
            >
              {t("Replace draft", "استبدال المسودة")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
