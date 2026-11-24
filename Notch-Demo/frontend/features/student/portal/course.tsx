"use client";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DropdownMenu } from "radix-ui";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  MoreHorizontal,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  announcements,
  assignments,
  courseConcepts,
  courseHref,
  courses,
  resourceKinds,
  sectionLabels,
  type Assignment,
  type Course,
  type CourseId,
  type Lesson,
  type Section,
} from "./data";
import { useStudent } from "./context";
import { useStudentPortal } from "./store";
import {
  completion,
  CourseIcon,
  MasteryMetrics,
  Recommendation,
  SectionTitle,
} from "./ui";

export function StudentCourse({
  id,
  section,
}: {
  id: CourseId;
  section: Section;
}) {
  const { t, language, profile } = useStudent();
  const course = courses.find((c) => c.id === id)!;
  const [opened, setOpened] = useState<Lesson | null>(null);
  const more: Section[] = ["submissions", "grades", "materials"];
  return (
    <div className="space-y-7 animate-fade-in">
      <Link
        href="/student/courses"
        className="inline-block text-sm font-medium text-muted-foreground hover:text-primary"
      >
        {t("Courses", "المقررات")} /{" "}
        <span className="text-foreground">{t(course.title)}</span>
      </Link>
      <header className="flex flex-wrap items-center gap-5">
        <CourseIcon course={course} large />
        <div className="min-w-0 flex-1">
          <p
            className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground"
            dir="ltr"
          >
            {course.code} · FALL 2026
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t(course.title)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(course.instructor)} · {t("3 credit hours", "٣ ساعات معتمدة")}
          </p>
        </div>
        <Badge tone="brand">
          {completion(course, profile.completed)}% {t("complete", "مكتمل")}
        </Badge>
      </header>
      <nav
        aria-label={t("Course navigation", "التنقل في المقرر")}
        className="flex flex-wrap items-center gap-1 border-b pb-1"
      >
        {(["progress", "announcements", "lectures", "labs"] as Section[]).map(
          (s) => (
            <Link
              key={s}
              href={courseHref(id, s)}
              aria-current={section === s ? "page" : undefined}
              className={`rounded-t-lg border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${section === s ? "border-primary bg-secondary/50 text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {t(sectionLabels[s])}
            </Link>
          ),
        )}
        <DropdownMenu.Root dir={language === "ar" ? "rtl" : "ltr"}>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              className={
                more.includes(section) ? "bg-secondary text-primary" : ""
              }
            >
              <MoreHorizontal aria-hidden="true" />
              {more.includes(section)
                ? t(sectionLabels[section])
                : t("More", "المزيد")}
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-40 min-w-48 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-raised"
            >
              {more.map((s) => (
                <DropdownMenu.Item key={s} asChild>
                  <Link
                    href={courseHref(id, s)}
                    aria-current={section === s ? "page" : undefined}
                    className="block rounded-lg px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-secondary data-[highlighted]:text-primary"
                  >
                    {t(sectionLabels[s])}
                  </Link>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </nav>
      {section === "progress" && <CourseProgress course={course} />}
      {section === "announcements" && <CourseAnnouncements course={course} />}
      {(section === "lectures" || section === "labs") && (
        <LessonList course={course} kind={section} onOpen={setOpened} />
      )}
      {section === "submissions" && <Submissions course={course} />}
      {section === "grades" && <Grades course={course} />}
      {section === "materials" && (
        <Materials course={course} onOpen={setOpened} />
      )}
      <LessonDialog
        course={course}
        lesson={opened}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}
function CourseProgress({ course }: { course: Course }) {
  const { t, student, profile } = useStudent();
  const concepts = courseConcepts(course, student);
  const lessons = [...course.lectures, ...course.labs];
  const finished = lessons.filter(
    (l) => l.done || profile.completed.includes(l.id),
  ).length;
  return (
    <div className="space-y-7">
      <MasteryMetrics course={course} />
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 sm:p-6">
          <SectionTitle
            title={t("Your knowledge, taking shape", "معرفتك تتشكل")}
            description={t(
              "Concept-level mastery · simulated estimates",
              "إتقان المفاهيم · تقديرات تجريبية",
            )}
          />
          <div className="space-y-5">
            {concepts.map((c) => (
              <div key={c.id}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{t(c.title)}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        c.mastery >= 80
                          ? "text-success"
                          : c.mastery < 70
                            ? "text-warning"
                            : "text-muted-foreground"
                      }
                    >
                      {c.mastery >= 80
                        ? t("Mastered", "متقن")
                        : c.mastery < 70
                          ? t("Needs practice", "يحتاج تدريبًا")
                          : t("Developing", "قيد التطور")}
                    </span>
                    <strong className="w-10 text-end tabular-nums">
                      {c.mastery}%
                    </strong>
                  </span>
                </div>
                <Progress
                  value={c.mastery}
                  tone={
                    c.mastery >= 80
                      ? "success"
                      : c.mastery < 70
                        ? "warning"
                        : "brand"
                  }
                  aria-label={t(c.title)}
                />
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <BookOpen className="mb-3 size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold">
              {t("Learning progress", "تقدم التعلّم")}
            </h2>
            <p className="my-3 text-3xl font-semibold">
              {completion(course, profile.completed)}%
            </p>
            <Progress
              value={completion(course, profile.completed)}
              aria-label={t("Course completion", "إكمال المقرر")}
            />
            <p className="mt-3 text-sm text-muted-foreground">
              {t(
                `${finished} of ${lessons.length} learning activities completed.`,
                `أكملت ${finished} من ${lessons.length} أنشطة تعليمية.`,
              )}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t(
                "Completing a lesson records activity. Mastery changes through assessment in the shared demo.",
                "إكمال الدرس يسجّل نشاطًا. يتغير الإتقان من خلال التقييم في العرض المشترك.",
              )}
            </p>
          </Card>
          <Recommendation course={course} featured />
        </div>
      </div>
    </div>
  );
}
function CourseAnnouncements({ course }: { course: Course }) {
  const { t, date } = useStudent();
  return (
    <section>
      <SectionTitle
        title={t("From your instructor", "من مدرس المقرر")}
        description={t(
          "Course updates, reminders, and a little guidance along the way.",
          "تحديثات المقرر وتذكيرات وإرشادات خلال رحلتك.",
        )}
      />
      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{t(a.title)}</h2>
              {a.important && (
                <Badge tone="warning">{t("Important", "مهم")}</Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(course.instructor)} · {date(a.date)} · {t(course.title)}
            </p>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              {t(a.body)}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
function LessonList({
  course,
  kind,
  onOpen,
}: {
  course: Course;
  kind: "lectures" | "labs";
  onOpen: (l: Lesson) => void;
}) {
  const { t, profile } = useStudent();
  return (
    <section>
      <SectionTitle
        title={t(
          kind === "lectures"
            ? "Learn at your own pace"
            : "Put your knowledge to work",
          kind === "lectures" ? "تعلّم بإيقاعك الخاص" : "طبّق معرفتك عمليًا",
        )}
        description={t(
          kind === "lectures"
            ? "Short lessons, clear ideas, and space to explore."
            : "Practical challenges that bring the concepts together.",
          kind === "lectures"
            ? "دروس قصيرة وأفكار واضحة ومساحة للاستكشاف."
            : "تحديات عملية تربط المفاهيم معًا.",
        )}
      />
      <div className="space-y-4">
        {course[kind].map((l, i) => {
          const done = l.done || profile.completed.includes(l.id);
          return (
            <Card
              key={l.id}
              className="flex flex-wrap items-center gap-4 p-5 sm:p-6"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                {done ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-xs font-medium text-muted-foreground">
                  {t(
                    kind === "lectures" ? "Lecture" : "Lab",
                    kind === "lectures" ? "محاضرة" : "معمل",
                  )}{" "}
                  {i + 1} · {l.minutes} {t("min", "دقيقة")}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{t(l.title)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(l.description)}
                </p>
              </div>
              <Badge tone={done ? "success" : "neutral"}>
                {done
                  ? t("Completed", "مكتمل")
                  : t("Ready to start", "جاهز للبدء")}
              </Badge>
              <Button
                variant={done ? "outline" : "default"}
                onClick={() => onOpen(l)}
              >
                {done
                  ? t("View lesson", "عرض الدرس")
                  : t(
                      kind === "labs" ? "Start lab" : "Continue learning",
                      kind === "labs" ? "بدء المعمل" : "متابعة التعلم",
                    )}
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
function LessonDialog({
  course,
  lesson,
  onClose,
}: {
  course: Course;
  lesson: Lesson | null;
  onClose: () => void;
}) {
  const { t, language, student, profile } = useStudent();
  const done = lesson && (lesson.done || profile.completed.includes(lesson.id));
  return (
    <Dialog.Root
      open={!!lesson}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          dir={language === "ar" ? "rtl" : "ltr"}
          className="fixed start-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 shadow-raised rtl:translate-x-1/2 sm:p-8"
        >
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-3 top-3"
              aria-label={t("Close lesson", "إغلاق الدرس")}
            >
              <X />
            </Button>
          </Dialog.Close>
          {lesson && (
            <>
              <p className="mb-3 pe-8 text-sm font-medium text-primary">
                {t(course.title)}
              </p>
              <Dialog.Title className="pe-6 text-2xl font-semibold">
                {t(lesson.title)}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-muted-foreground">
                {t(lesson.description)}
              </Dialog.Description>
              <div className="my-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                {lesson.minutes}{" "}
                {t(
                  "minute learning session · Demo lesson",
                  "دقيقة للتعلّم · درس تجريبي",
                )}
              </div>
              <p className="leading-8">{t(lesson.content)}</p>
              <div className="my-6 rounded-xl border bg-secondary/40 p-5">
                <h3 className="mb-2 font-semibold">
                  {t("Try it yourself", "جرّب بنفسك")}
                </h3>
                <p className="leading-7">{t(lesson.exercise)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={!!done}
                  onClick={() =>
                    useStudentPortal.getState().complete(student.id, lesson.id)
                  }
                >
                  <CheckCircle2 />
                  {done
                    ? t("Completed", "مكتمل")
                    : t("Mark as complete", "تحديد كمكتمل")}
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href={`/student/chatbot?course=${course.id}`}
                    onClick={onClose}
                  >
                    {t("Ask the assistant", "اسأل المساعد")}
                  </Link>
                </Button>
              </div>
              <p role="status" className="mt-4 text-sm text-success">
                {done
                  ? t(
                      "This activity is complete. Your course progress is up to date.",
                      "اكتمل النشاط. تم تحديث تقدمك في المقرر.",
                    )
                  : ""}
              </p>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function Submissions({ course }: { course: Course }) {
  const { t, ready } = useStudent();
  if (!ready)
    return (
      <div
        className="h-64 animate-pulse rounded-xl bg-muted"
        aria-label={t("Loading submissions", "جارٍ تحميل التسليمات")}
      />
    );
  return (
    <section>
      <SectionTitle
        title={t("Assignments & submissions", "الواجبات والتسليمات")}
        description={t(
          "Save your work, then submit a simulated response. Nothing is sent to an instructor.",
          "احفظ عملك ثم قدّم إجابة تجريبية. لن يُرسل أي شيء إلى المدرّس.",
        )}
      />
      <div className="space-y-4">
        {assignments
          .filter((a) => a.courseId === course.id && a.weight === 20)
          .map((a) => (
            <Submission key={a.id} assignment={a} />
          ))}
      </div>
      <h3 className="mb-3 mt-6 font-semibold">
        {t("Previously graded work", "أعمال تم تقييمها سابقًا")}
      </h3>
      <Card className="divide-y">
        {assignments
          .filter((a) => a.courseId === course.id && a.status === "graded")
          .map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap justify-between gap-3 p-4"
            >
              <span>{t(a.title)}</span>
              <Badge tone="success">
                {t("Graded", "تم التقييم")} · {a.score}/100
              </Badge>
            </div>
          ))}
      </Card>
    </section>
  );
}
function Submission({ assignment: a }: { assignment: Assignment }) {
  const { t, date, student, profile } = useStudent();
  const submitted = a.status === "submitted" || !!profile.submissions[a.id];
  const [response, setResponse] = useState(
    profile.drafts[a.id] ?? profile.submissions[a.id] ?? "",
  );
  const [saved, setSaved] = useState(false);
  const update = useStudentPortal((s) => s.update);
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t(a.title)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Due", "موعد التسليم")}{" "}
            {date(a.due, {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {t("Cairo time", "بتوقيت القاهرة")}
          </p>
        </div>
        <Badge tone={submitted ? "success" : "warning"}>
          {submitted
            ? t("Submitted", "تم التسليم")
            : t("Pending submission", "بانتظار التسليم")}
        </Badge>
      </div>
      <p className="my-4 text-sm leading-6 text-muted-foreground">
        {t(
          "Use the current lecture and lab to prepare your response. Describe your approach, include a worked example, and explain what you learned.",
          "استخدم المحاضرة والمعمل الحاليين لإعداد إجابتك. صف طريقتك وأضف مثالًا محلولًا واشرح ما تعلمته.",
        )}
      </p>
      {submitted ? (
        <div className="rounded-lg bg-success-soft p-4 text-sm text-success">
          <CheckCircle2 className="mb-2 size-5" />
          <p>
            {t(
              "Your demo submission is saved and awaiting review.",
              "تم حفظ تسليمك التجريبي وهو بانتظار المراجعة.",
            )}
          </p>
          {profile.submissions[a.id] && (
            <p className="mt-3 whitespace-pre-wrap text-foreground">
              {profile.submissions[a.id]}
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (response.trim())
              update(student.id, {
                submissions: {
                  ...profile.submissions,
                  [a.id]: response.trim(),
                },
                drafts: { ...profile.drafts, [a.id]: response },
              });
          }}
        >
          <label
            htmlFor={`response-${a.id}`}
            className="mb-2 block text-sm font-medium"
          >
            {t("Your response", "إجابتك")}
          </label>
          <textarea
            id={`response-${a.id}`}
            required
            maxLength={10000}
            rows={5}
            value={response}
            onChange={(e) => {
              setResponse(e.target.value);
              setSaved(false);
            }}
            className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm"
            placeholder={t(
              "Write your approach and example here…",
              "اكتب طريقتك ومثالك هنا…",
            )}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!response.trim()}>
              {t("Submit demo response", "تقديم إجابة تجريبية")}
            </Button>
            <Button
              variant="outline"
              disabled={!response.trim()}
              onClick={() => {
                update(student.id, {
                  drafts: { ...profile.drafts, [a.id]: response },
                });
                setSaved(true);
              }}
            >
              {t("Save draft", "حفظ المسودة")}
            </Button>
            <span role="status" className="text-sm text-success">
              {saved ? t("Draft saved", "تم حفظ المسودة") : ""}
            </span>
          </div>
        </form>
      )}
    </Card>
  );
}
function Grades({ course }: { course: Course }) {
  const { t, date } = useStudent();
  const work = assignments.filter((a) => a.courseId === course.id);
  const graded = work.filter((a) => a.score !== undefined);
  const grade = Math.round(
    graded.reduce((sum, a) => sum + a.score! * a.weight, 0) /
      graded.reduce((sum, a) => sum + a.weight, 0),
  );
  return (
    <section>
      <SectionTitle
        title={t("A clearer picture of your performance", "صورة أوضح لأدائك")}
        description={t(
          "Sample grades are separate from concept mastery.",
          "الدرجات التجريبية مستقلة عن إتقان المفاهيم.",
        )}
      />
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-secondary/40 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            {t("Overall course grade", "الدرجة العامة للمقرر")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              "Weighted average of graded work only · 80% of course weight graded",
              "متوسط مرجّح للأعمال المقيّمة فقط · تم تقييم ٨٠٪ من وزن المقرر",
            )}
          </p>
        </div>
        <strong className="text-4xl tracking-tight text-primary">
          {grade}
          <span className="text-lg font-normal text-muted-foreground">
            {" "}
            / 100
          </span>
        </strong>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-start text-sm">
          <caption className="sr-only">
            {t("Course grade breakdown", "تفصيل درجات المقرر")}
          </caption>
          <thead className="bg-muted/60">
            <tr>
              {[
                t("Assessment", "التقييم"),
                t("Type", "النوع"),
                t("Weight", "الوزن"),
                t("Grade", "الدرجة"),
                t("Date", "التاريخ"),
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="p-4 text-start font-medium text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {work.map((a) => (
              <tr key={a.id} className="border-t">
                <th scope="row" className="p-4 text-start font-medium">
                  {t(a.title)}
                </th>
                <td className="p-4">{t(a.kind)}</td>
                <td className="p-4">{a.weight}%</td>
                <td className="p-4 font-semibold">
                  {a.score === undefined
                    ? t("Not graded", "لم يُقيّم")
                    : `${a.score}/100`}
                </td>
                <td className="p-4 text-muted-foreground">{date(a.due)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
function Materials({
  course,
  onOpen,
}: {
  course: Course;
  onOpen: (l: Lesson) => void;
}) {
  const { t, language } = useStudent();
  function download() {
    const text = [
      t(course.title),
      ...course.lectures.flatMap((l) => [
        t(l.title),
        t(l.content),
        t(l.exercise),
      ]),
    ].join("\n\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `notch-${course.id}-${language}-study-guide.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section>
      <SectionTitle
        title={t("A little more to explore", "المزيد للاستكشاف")}
        description={t(
          "Supplementary reading and examples for independent study.",
          "قراءات وأمثلة إضافية للدراسة المستقلة.",
        )}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {resourceKinds.map((kind, i) => (
          <Card key={kind[0]} className="p-5">
            <FileText className="mb-4 size-6 text-primary" aria-hidden="true" />
            <h3 className="font-semibold">
              {t(course.title)} · {t(kind)}
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {t(course.lectures[i % course.lectures.length].description)}
            </p>
            <Button
              variant="outline"
              onClick={() =>
                onOpen(course.lectures[i % course.lectures.length])
              }
            >
              {t("Read material", "قراءة المادة")}
            </Button>
          </Card>
        ))}
        <Card className="p-5">
          <Download className="mb-4 size-6 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">
            {t("Take your study notes with you", "اصطحب ملاحظاتك الدراسية")}
          </h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            {t(
              "Download all sample lesson summaries and exercises as a text file.",
              "نزّل ملخصات الدروس التجريبية والتمارين في ملف نصي.",
            )}
          </p>
          <Button variant="outline" onClick={download}>
            {t("Download study guide (.txt)", "تنزيل دليل الدراسة (.txt)")}
          </Button>
        </Card>
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-xl bg-secondary/40 p-4 text-sm text-muted-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          {t(
            "Need another explanation? Your simulated assistant can walk through the ideas in these materials.",
            "تحتاج شرحًا آخر؟ يمكن لمساعدك التجريبي توضيح أفكار هذه المواد.",
          )}{" "}
          <Link
            className="font-medium text-primary hover:underline"
            href={`/student/chatbot?course=${course.id}`}
          >
            {t("Open assistant", "فتح المساعد")}
          </Link>
        </p>
      </div>
    </section>
  );
}
