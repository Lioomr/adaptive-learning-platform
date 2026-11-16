"use client";
import {
  Link,
  ShieldCheck,
  BookOpen,
  Route,
  Check,
  useState,
} from "@/features/advisor/runtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { useDemo } from "@/store/demo";
import { conceptsForCourse, courses } from "@/data/fixtures";
import { recommendation, PREREQUISITE_READY } from "@/services/mastery";
import type { Student } from "@/types";
import { diagnosisFor } from "../services/advisor";
import { nameOf } from "../services/language";
import { useAdvisorLocale } from "./advisor-layout";
import {
  Heading,
  Panel,
  Empty,
  StudentLink,
  Band,
  Meter,
  CourseSummary,
  BackLink,
} from "./common";
import { WarningList } from "./warnings";
import styles from "./advisor.module.css";
export function StudentOverview({ student }: { student: Student }) {
  const { lang, t } = useAdvisorLocale();
  const attempts = useDemo((s) => s.attempts)
    .filter((a) => a.studentId === student.id)
    .slice()
    .reverse();
  const nudges = useDemo((s) => s.nudges)
    .filter((n) => n.studentId === student.id)
    .slice()
    .reverse();
  const episodes = diagnosisFor(student);
  return (
    <>
      <Heading
        id="AD3"
        title={t(
          `${student.name}’s learning, connected.`,
          `تعلم ${nameOf(student.name, lang)}، بصورة مترابطة.`,
        )}
        description={t(
          "Shared mastery, clear context and a practical path forward.",
          "إتقان مشترك وسياق واضح ومسار عملي للتقدم.",
        )}
        action={<BackLink />}
      />
      <div className={styles.profileBar}>
        <div className={styles.inline}>
          <StudentAvatar name={student.name} />
          <div>
            <strong>{nameOf(student.name, lang)}</strong>
            <p>
              {t(
                "Assigned fictional student · Both courses",
                "طالب افتراضي مسند · المقرران معاً",
              )}
            </p>
          </div>
        </div>
        <div className={styles.inline}>
          <StudentLink student={student} screen="ad6">
            {t("View plan", "عرض الخطة")}
          </StudentLink>
          <Button asChild>
            <StudentLink student={student} screen="ad4">
              {t("Prepare a nudge", "إعداد رسالة دعم")}
            </StudentLink>
          </Button>
        </div>
      </div>
      <CourseSummary student={student} />
      <Panel
        title={t("Compact skill map", "خريطة المهارات المختصرة")}
        description={t(
          "Select a concept to inspect its prerequisites. Values match the shared Student and Instructor foundation.",
          "اختر مفهوماً لفحص متطلباته. القيم مطابقة لبيانات الطالب والمدرس المشتركة.",
        )}
      >
        <div className={styles.twoColumns}>
          {courses.map((c) => (
            <div key={c.id}>
              <h3 className={styles.sectionLabel}>{nameOf(c.id, lang)}</h3>
              <div className={styles.skillGrid}>
                {conceptsForCourse(c.id).map((concept) => (
                  <details
                    key={concept.id}
                    id={`concept-${concept.id}`}
                    className={styles.skill}
                  >
                    <summary>
                      <span>{nameOf(concept.id, lang)}</span>
                      <strong>{student.mastery[concept.id]}%</strong>
                      <Meter
                        value={student.mastery[concept.id]}
                        label={nameOf(concept.id, lang)}
                      />
                    </summary>
                    <Band value={student.mastery[concept.id]} />
                    <p>
                      {t("Prerequisites", "المتطلبات السابقة")}:{" "}
                      {concept.prerequisites.length
                        ? concept.prerequisites
                            .map(
                              (id) =>
                                `${nameOf(id, lang)} ${student.mastery[id]}%`,
                            )
                            .join(" · ")
                        : t("None", "لا يوجد")}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title={t("Diagnosis & linked rationale", "التشخيص والمبررات المرتبطة")}
        description={t(
          "Simulated learning support, not a clinical diagnosis. Snapshot suggestions are distinct from recorded episodes.",
          "دعم تعليمي محاكى وليس تشخيصاً طبياً. اقتراحات خط الأساس منفصلة عن المحاولات المسجلة.",
        )}
      >
        {episodes.length ? (
          <div className={styles.diagnosis}>
            {episodes.map(({ concept, advice }) => (
              <div key={concept.id}>
                <Badge tone="ai">
                  {t("Simulated snapshot", "لقطة محاكاة")}
                </Badge>
                <h3>{nameOf(concept.id, lang)}</h3>
                <p>
                  {advice.kind === "review"
                    ? t(
                        `Review ${nameOf(advice.prerequisiteId, lang)} first: mastery is below 70%.`,
                        `راجع ${nameOf(advice.prerequisiteId, lang)} أولاً: الإتقان أقل من ٧٠٪.`,
                      )
                    : t(
                        "Prerequisites are ready. Practise this concept next.",
                        "المتطلبات جاهزة. تدرب على هذا المفهوم تالياً.",
                      )}
                </p>
                <a
                  href={`#concept-${advice.kind === "review" ? advice.prerequisiteId : concept.id}`}
                  onClick={() => {
                    const el = document.getElementById(
                      `concept-${advice.kind === "review" ? advice.prerequisiteId : concept.id}`,
                    );
                    if (el instanceof HTMLDetailsElement) el.open = true;
                  }}
                >
                  {t("Inspect supporting mastery", "فحص الإتقان الداعم")}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title={t("Prerequisites ready", "المتطلبات جاهزة")}
            description={t(
              "All concept values meet the 70% readiness threshold.",
              "جميع قيم المفاهيم تحقق حد الاستعداد ٧٠٪.",
            )}
          />
        )}
        <h3 className={styles.sectionLabel}>
          {t(
            "Recorded diagnosis episodes / recent activity",
            "المحاولات التشخيصية المسجلة / النشاط الأخير",
          )}
        </h3>
        {attempts.length ? (
          <ul className={styles.timeline}>
            {attempts.map((a) => (
              <li key={a.submissionId}>
                <strong>{nameOf(a.conceptId, lang)}</strong>
                <p>
                  {t("Score", "النتيجة")} {a.score}% · {t("Mastery", "الإتقان")}{" "}
                  {a.previous}% → {a.mastery}%
                </p>
                <time>{new Date(a.createdAt).toLocaleString(lang)}</time>
                <p>
                  {t(
                    "Evidence: recorded simulated assessment; 60% previous mastery + 40% score.",
                    "الدليل: تقييم محاكاة مسجل؛ ٦٠٪ من الإتقان السابق + ٤٠٪ من النتيجة.",
                  )}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>
            {t(
              "No recorded diagnosis episodes yet. The skill map is a fictional baseline, not evidence of repeated attempts.",
              "لا توجد محاولات تشخيصية مسجلة. الخريطة خط أساس افتراضي وليست دليلاً على محاولات متكررة.",
            )}
          </p>
        )}
      </Panel>
      <Panel title={t("Support opportunities", "فرص الدعم")}>
        <WarningList student={student} compact />
      </Panel>
      <Panel
        title={t("Advisor interaction history", "سجل تفاعل المرشد")}
        description={t(
          "Session-only simulated nudges. Reset or reload clears this history.",
          "رسائل محاكاة لهذه الجلسة فقط. يمسحها إعادة الضبط أو تحميل الصفحة.",
        )}
      >
        {nudges.length ? (
          <ul className={styles.timeline}>
            {nudges.map((n) => (
              <li key={n.id}>
                <Badge tone="success">
                  {t("Simulated · no delivery", "محاكاة · دون إرسال فعلي")}
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
              "No nudges recorded this session.",
              "لا توجد رسائل مسجلة في هذه الجلسة.",
            )}
          </p>
        )}
      </Panel>
    </>
  );
}
export function Planning({ student }: { student: Student }) {
  const { lang, t } = useAdvisorLocale();
  return (
    <>
      <Heading
        id="AD6"
        title={t("A plan built on readiness.", "خطة مبنية على الاستعداد.")}
        description={t(
          `A simulated roadmap for ${student.name}, across both course graphs.`,
          `خارطة طريق محاكاة للطالب ${nameOf(student.name, lang)} عبر المقررين.`,
        )}
        action={
          <StudentLink student={student}>
            {t("Back to student", "العودة إلى الطالب")}
          </StudentLink>
        }
      />
      <div className={styles.info}>
        <Route size={22} aria-hidden="true" />
        <div>
          <strong>
            {t("Readiness starts at 70%", "يبدأ الاستعداد من ٧٠٪")}
          </strong>
          <p>
            {t(
              "Suggestions use shared prerequisite values. They do not predict success, enroll a student or block practice. Only Python and Mathematics are in the approved catalog; no later courses are specified.",
              "تستخدم الاقتراحات قيم المتطلبات المشتركة. لا تتنبأ بالنجاح أو تسجل الطالب أو تمنع التدريب. يضم الكتالوج المعتمد بايثون والرياضيات فقط؛ لا توجد مقررات لاحقة محددة.",
            )}
          </p>
        </div>
      </div>
      <CourseSummary student={student} />
      <div className={styles.twoColumns}>
        {courses.map((course) => {
          const items = conceptsForCourse(course.id);
          const focus = items.find(
            (c) => student.mastery[c.id] < PREREQUISITE_READY,
          );
          return (
            <Panel
              key={course.id}
              title={nameOf(course.id, lang)}
              description={t(
                "Suggested next course focus · Simulated",
                "التركيز التالي المقترح في المقرر · محاكاة",
              )}
            >
              <div className={styles.planFocus}>
                <BookOpen size={20} aria-hidden="true" />
                <div>
                  <strong>
                    {focus
                      ? nameOf(focus.id, lang)
                      : t("Consolidate and review", "التثبيت والمراجعة")}
                  </strong>
                  <p>
                    {focus
                      ? t(
                          "First concept below 70% in the shared course order.",
                          "أول مفهوم دون ٧٠٪ بترتيب المقرر المشترك.",
                        )
                      : t(
                          "All concepts meet the readiness threshold.",
                          "جميع المفاهيم تحقق حد الاستعداد.",
                        )}
                  </p>
                </div>
              </div>
              <ol className={styles.roadmap}>
                {items.map((c) => {
                  const advice = recommendation(student, c.id);
                  return (
                    <li key={c.id}>
                      <span className={styles.roadmapDot} />
                      <div className={styles.inline}>
                        <h3>{nameOf(c.id, lang)}</h3>
                        <Badge
                          tone={advice.kind === "ready" ? "success" : "warning"}
                        >
                          {advice.kind === "ready"
                            ? t("Ready to practise", "جاهز للتدريب")
                            : t("Review first", "راجع أولاً")}
                        </Badge>
                      </div>
                      <p>
                        {t("Current mastery", "الإتقان الحالي")}:{" "}
                        {student.mastery[c.id]}%
                      </p>
                      <p>
                        {t("Prerequisites", "المتطلبات")}:{" "}
                        {c.prerequisites.length
                          ? c.prerequisites
                              .map(
                                (id) =>
                                  `${nameOf(id, lang)} (${student.mastery[id]}%)`,
                              )
                              .join(" · ")
                          : t("No prerequisite", "لا يوجد متطلب سابق")}
                      </p>
                      {advice.kind === "review" && (
                        <strong className={styles.recommendation}>
                          {t("Next step", "الخطوة التالية")}:{" "}
                          {nameOf(advice.prerequisiteId, lang)}
                        </strong>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Panel>
          );
        })}
      </div>
      <Button asChild>
        <StudentLink student={student} screen="ad4">
          {t("Discuss this plan with a nudge", "ناقش الخطة برسالة دعم")}
        </StudentLink>
      </Button>
    </>
  );
}
export function Onboarding({ students }: { students: Student[] }) {
  const { t, lang } = useAdvisorLocale();
  const [ack, setAck] = useState(false);
  return (
    <>
      <Heading
        id="AD1"
        title={t(
          "Support learning. Respect boundaries.",
          "ادعم التعلم. واحترم الخصوصية.",
        )}
        description={t(
          "Welcome to your academic advising workspace.",
          "مرحباً بك في مساحة الإرشاد الأكاديمي.",
        )}
      />
      <div className={styles.welcome}>
        <ShieldCheck size={40} aria-hidden="true" />
        <div>
          <Badge tone="brand">
            {t(
              "Academic advisor · simulated role",
              "مرشد أكاديمي · دور محاكاة",
            )}
          </Badge>
          <h2>
            {t(
              "A little context can make a meaningful difference.",
              "قد يصنع فهم السياق فرقاً مهماً.",
            )}
          </h2>
          <p>
            {t(
              "Understand course progress, agree on a next step and offer a supportive check-in. Your role is guidance and planning.",
              "افهم تقدم الطالب، واتفق معه على خطوة تالية، وقدم دعماً ودياً. دورك هو الإرشاد والتخطيط.",
            )}
          </p>
        </div>
      </div>
      <div className={styles.twoColumns}>
        <Panel title={t("What you can see", "ما يمكنك رؤيته")}>
          <ul className={styles.checkList}>
            {[
              [
                "Assigned fictional students in both courses",
                "الطلاب الافتراضيون المسندون في المقررين",
              ],
              [
                "Shared mastery, activity and prerequisite readiness",
                "الإتقان المشترك والنشاط والاستعداد",
              ],
              [
                "Explainable warnings and simulated nudge history",
                "تنبيهات واضحة وسجل رسائل محاكاة",
              ],
            ].map(([en, ar]) => (
              <li key={en}>
                <Check size={18} aria-hidden="true" />
                {t(en, ar)}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t("Privacy & consent limits", "حدود الخصوصية والموافقة")}>
          <p>
            {t(
              "Private tutor transcripts, grades outside the platform and instructor approval screens are excluded from this advisor workspace. There is no real assignment, authentication or consent collection in Phase 1.",
              "لا تتاح محادثات المعلم الخاص أو الدرجات خارج المنصة أو شاشات موافقة المدرس في مساحة المرشد. لا يوجد إسناد فعلي أو مصادقة أو جمع موافقات حقيقية في المرحلة الأولى.",
            )}
          </p>
          <p className={styles.note}>
            {t(
              "The shared portal switcher is a demo preview tool, not an advisor permission to approve content.",
              "مبدّل البوابات المشترك أداة معاينة، وليس صلاحية للمرشد لاعتماد المحتوى.",
            )}
          </p>
        </Panel>
      </div>
      <Panel
        title={t("Your simulated assignment", "إسنادك الافتراضي")}
        description={t(
          `${students.length} fictional students · Python and Mathematics`,
          `${students.length} طلاب افتراضيون · بايثون والرياضيات`,
        )}
      >
        <div className={styles.assignment}>
          {students.map((s) => (
            <StudentLink key={s.id} student={s}>
              {nameOf(s.name, lang)}
            </StudentLink>
          ))}
        </div>
        <div className={styles.consent}>
          <label>
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            {t(
              "I understand this is a simulation and the visibility limits above.",
              "أفهم أن هذه محاكاة وحدود الرؤية موضحة أعلاه.",
            )}
          </label>
          <p>
            {t(
              "This acknowledgement stays on this screen and does not record legal consent.",
              "يبقى هذا الإقرار في هذه الشاشة ولا يسجل موافقة قانونية.",
            )}
          </p>
          <Button asChild={ack} disabled={!ack}>
            {ack ? (
              <Link href="/advisor/ad2">
                {t("Open my caseload", "فتح قائمة طلابي")}
              </Link>
            ) : (
              t("Open my caseload", "فتح قائمة طلابي")
            )}
          </Button>
        </div>
      </Panel>
    </>
  );
}
