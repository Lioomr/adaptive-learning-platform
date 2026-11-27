import { courses, type Copy, type CourseId } from "@/features/student/portal/data";
import { instructorAccounts } from "@/features/instructor/portal/data";

export type { Copy, CourseId };
const c2 = (en: string, ar: string): Copy => [en, ar];

/* ---------- Roles and permissions ---------- */
export type RoleId = "ta" | "instructor" | "coordinator" | "admin";
export const ROLES: RoleId[] = ["ta", "instructor", "coordinator", "admin"];
export const roleLabel: Record<RoleId, Copy> = { ta: c2("Teaching Assistant", "مساعد تدريس"), instructor: c2("Course Instructor", "مدرّس المقرر"), coordinator: c2("Course Coordinator", "منسّق المقرر"), admin: c2("Department Administrator", "مسؤول القسم") };
export const roleRank: Record<RoleId, number> = { ta: 0, instructor: 1, coordinator: 2, admin: 3 };

/** Mock assignment: the role each demo instructor holds in each course. Set by the department, not editable here. */
export const roleIn: Record<string, Partial<Record<CourseId, RoleId>>> = {
  "I-HANA": { python: "coordinator", algorithms: "instructor", ai: "ta" },
  "I-MATH": { mathematics: "instructor" },
  "I-ENG": { english: "ta" },
};
export const roleFor = (instructorId: string, courseId: string): RoleId => roleIn[instructorId]?.[courseId as CourseId] ?? "ta";

export type PermId = "view" | "upload" | "concepts" | "approve" | "create" | "publish" | "analytics" | "assignments" | "attendance" | "grade" | "settings";
export type Grant = "yes" | "limited" | "no";
export const PERMS: { id: PermId; label: Copy; desc: Copy }[] = [
  { id: "view", label: c2("View course materials", "عرض مواد المقرر"), desc: c2("Open lectures, labs and extra materials.", "فتح المحاضرات والمعامل والمواد الإضافية.") },
  { id: "upload", label: c2("Upload course materials", "رفع مواد المقرر"), desc: c2("Add files that students and the AI tutor may use.", "إضافة ملفات يستخدمها الطلاب والمساعد الذكي.") },
  { id: "concepts", label: c2("Edit knowledge concepts", "تعديل المفاهيم المعرفية"), desc: c2("Change extracted concepts and their prerequisites.", "تغيير المفاهيم المستخرجة ومتطلباتها.") },
  { id: "approve", label: c2("Approve generated questions", "اعتماد الأسئلة المولَّدة"), desc: c2("Review AI-generated questions before students see them.", "مراجعة الأسئلة المولَّدة قبل أن يراها الطلاب.") },
  { id: "create", label: c2("Create assessments", "إنشاء التقييمات"), desc: c2("Build quizzes and exams from approved questions.", "بناء الاختبارات من الأسئلة المعتمدة.") },
  { id: "publish", label: c2("Publish assessments", "نشر التقييمات"), desc: c2("Make an assessment available to students.", "إتاحة التقييم للطلاب.") },
  { id: "analytics", label: c2("View student analytics", "عرض تحليلات الطلاب"), desc: c2("See mastery, progress and risk indicators.", "رؤية الإتقان والتقدم ومؤشرات الخطر.") },
  { id: "assignments", label: c2("Manage assignments", "إدارة الواجبات"), desc: c2("Create, edit, schedule and archive assignments.", "إنشاء الواجبات وتعديلها وجدولتها وأرشفتها.") },
  { id: "attendance", label: c2("Record attendance", "تسجيل الحضور"), desc: c2("Take and edit session attendance.", "تسجيل حضور الجلسات وتعديله.") },
  { id: "grade", label: c2("Grade submissions", "تصحيح التسليمات"), desc: c2("Enter marks and feedback and return work.", "إدخال الدرجات والملاحظات وإعادة الأعمال.") },
  { id: "settings", label: c2("Manage course settings", "إدارة إعدادات المقرر"), desc: c2("Change course rules, visibility and enrollment.", "تغيير قواعد المقرر وظهوره والتسجيل فيه.") },
];
const all = (o: Partial<Record<PermId, Grant>>): Record<PermId, Grant> => ({ view: "yes", upload: "yes", concepts: "yes", approve: "yes", create: "yes", publish: "yes", analytics: "yes", assignments: "yes", attendance: "yes", grade: "yes", settings: "yes", ...o });
export const grants: Record<RoleId, Record<PermId, Grant>> = {
  ta: all({ upload: "no", concepts: "no", approve: "no", publish: "no", assignments: "limited", settings: "no", create: "limited" }),
  instructor: all({ settings: "limited" }),
  coordinator: all({}),
  admin: all({}),
};
/** Who can approve a request for each permission. */
export const grantedBy: Record<RoleId, Copy> = { ta: c2("your Course Instructor", "مدرّس المقرر"), instructor: c2("the Course Coordinator", "منسّق المقرر"), coordinator: c2("a Department Administrator", "مسؤول القسم"), admin: c2("the platform administrators", "إداريي المنصة") };
export const grantNote: Partial<Record<RoleId, Partial<Record<PermId, Copy>>>> = {
  ta: { create: c2("Drafts only; a Course Instructor must publish.", "مسودات فقط؛ على مدرّس المقرر النشر."), assignments: c2("Can edit and grade; cannot delete or archive.", "يمكن التعديل والتصحيح؛ لا الحذف أو الأرشفة.") },
  instructor: { settings: c2("Learning rules, description and completion only. Title, term, visibility and enrollment need a Coordinator.", "قواعد التعلم والوصف والإنجاز فقط. العنوان والفصل والظهور والتسجيل تحتاج منسّقًا.") },
};

export type Member = { id: string; name: Copy; role: RoleId; you?: boolean };
export function seedTeam(instructorId: string, courseId: CourseId): Member[] {
  const me = instructorAccounts.find((a) => a.id === instructorId)!;
  const others: Member[] = courseId === "python" ? [{ id: "m1", name: c2("Dr. Karim Nabil", "د. كريم نبيل"), role: "instructor" }, { id: "m2", name: c2("Eng. Omnia Fathy", "م. أمنية فتحي"), role: "ta" }]
    : courseId === "algorithms" ? [{ id: "m3", name: c2("Dr. Samir Adel", "د. سمير عادل"), role: "coordinator" }, { id: "m4", name: c2("Eng. Reem Ali", "م. ريم علي"), role: "ta" }]
    : courseId === "ai" ? [{ id: "m5", name: c2("Dr. Laila Mansour", "د. ليلى منصور"), role: "instructor" }, { id: "m6", name: c2("Prof. Tarek Salem", "أ.د. طارق سالم"), role: "coordinator" }]
    : [{ id: "m7", name: c2("Dr. Nadia Fouad", "د. نادية فؤاد"), role: "coordinator" }];
  return [{ id: "me", name: me.name, role: roleFor(instructorId, courseId), you: true }, ...others];
}

/* ---------- Settings model ---------- */
export type CourseCfg = {
  title: Copy; description: Copy; term: string; language: "en" | "ar" | "both"; studentLanguage: "auto" | "en" | "ar";
  visibility: "hidden" | "enrolled" | "catalogue"; enrollment: { mode: "open" | "approval" | "closed"; capacity: number };
  completion: { pct: number; requireLabs: boolean; requireFinal: boolean };
};
export type AiCfg = {
  threshold: number; strictness: "flexible" | "balanced" | "strict"; remediation: boolean; tutorLang: "match" | "en" | "ar" | "both";
  sourceMode: "all" | "selected"; sources: string[]; unavailable: "flag" | "suggest" | "abstain"; masteryVisibility: "hidden" | "concepts" | "detail";
  adaptive: "on" | "after-lecture" | "off";
};
export type NotifKey = "approvals" | "atRisk" | "oob" | "submissions" | "grading" | "attendance" | "assessments" | "errors";
export type Notif = { inApp: boolean; email: boolean; mode: "immediate" | "summary" };
export type Profile = { name: Copy; bio: string; office: string; photo: string | null; showProfile: boolean; showOffice: boolean; keepSignedIn: boolean };
export type LangCfg = { interface: "en" | "ar" | null; content: "ui" | "en" | "ar" | "both"; direction: "auto" | "rtl" | "ltr"; textSize: 100 | 112 | 125; reduceMotion: boolean; underlineLinks: boolean };
export type Request = { id: string; courseId: CourseId; perm: PermId; reason: string; status: "pending" };
export type Settings = {
  profile: Profile;
  courses: Record<string, { course: CourseCfg; ai: AiCfg }>;
  notifications: { items: Record<NotifKey, Notif>; emailEnabled: boolean; frequency: "daily" | "weekly" };
  team: Record<string, Member[]>;
  requests: Request[];
  language: LangCfg;
};
export type SectionId = "profile" | "course" | "ai" | "notifications" | "permissions" | "language";
export const SECTIONS: { id: SectionId; label: Copy; desc: Copy }[] = [
  { id: "profile", label: c2("Profile & Account", "الملف الشخصي والحساب"), desc: c2("Who you are on the platform", "هويتك على المنصة") },
  { id: "course", label: c2("Course Settings", "إعدادات المقرر"), desc: c2("Language, visibility, enrollment, completion", "اللغة والظهور والتسجيل والإنجاز") },
  { id: "ai", label: c2("Learning & AI Settings", "إعدادات التعلم والذكاء الاصطناعي"), desc: c2("Mastery, prerequisites and the AI tutor", "الإتقان والمتطلبات والمساعد الذكي") },
  { id: "notifications", label: c2("Notifications", "الإشعارات"), desc: c2("What reaches you, and how often", "ما يصلك وبأي وتيرة") },
  { id: "permissions", label: c2("Permissions & Access", "الصلاحيات والوصول"), desc: c2("Your role and what it allows", "دورك وما يتيحه") },
  { id: "language", label: c2("Language & Accessibility", "اللغة وسهولة الوصول"), desc: c2("Display, direction and comfort", "العرض والاتجاه والراحة") },
];
/** Which section each settings key belongs to, for unsaved-change dots. */
export const TERMS = [{ id: "fall-2026", label: c2("Fall 2026 (current)", "خريف 2026 (الحالي)") }, { id: "spring-2027", label: c2("Spring 2027 (upcoming)", "ربيع 2027 (القادم)") }];

export const defaultNotifs = (): Settings["notifications"] => ({
  emailEnabled: true, frequency: "daily",
  items: {
    approvals: { inApp: true, email: false, mode: "immediate" }, atRisk: { inApp: true, email: false, mode: "summary" }, oob: { inApp: true, email: false, mode: "immediate" },
    submissions: { inApp: true, email: false, mode: "summary" }, grading: { inApp: true, email: false, mode: "summary" }, attendance: { inApp: true, email: false, mode: "summary" },
    assessments: { inApp: true, email: true, mode: "immediate" }, errors: { inApp: true, email: true, mode: "immediate" },
  },
});
export const defaultLanguage = (): LangCfg => ({ interface: null, content: "ui", direction: "auto", textSize: 100, reduceMotion: false, underlineLinks: false });
export const defaultProfile = (instructorId: string): Profile => {
  const a = instructorAccounts.find((x) => x.id === instructorId)!;
  return { name: a.name, bio: "", office: "Wed 14:00–16:00, room 3.12", photo: null, showProfile: true, showOffice: true, keepSignedIn: false };
};
export const defaultCourse = (courseId: string): { course: CourseCfg; ai: AiCfg } => {
  const c = courses.find((x) => x.id === courseId)!;
  return {
    course: { title: c.title, description: c.description, term: "fall-2026", language: "both", studentLanguage: "auto", visibility: "enrolled", enrollment: { mode: "approval", capacity: 60 }, completion: { pct: 80, requireLabs: true, requireFinal: false } },
    ai: { threshold: 70, strictness: "balanced", remediation: true, tutorLang: "match", sourceMode: "all", sources: [], unavailable: "flag", masteryVisibility: "concepts", adaptive: "on" },
  };
};
export function defaults(instructorId: string): Settings {
  const mine = instructorAccounts.find((a) => a.id === instructorId)?.courseIds ?? [];
  return {
    profile: defaultProfile(instructorId),
    courses: Object.fromEntries(mine.map((id) => [id, defaultCourse(id)])),
    notifications: defaultNotifs(),
    team: Object.fromEntries(mine.map((id) => [id, seedTeam(instructorId, id)])),
    requests: [], language: defaultLanguage(),
  };
}
export const emailOf = (instructorId: string) => ({ "I-HANA": "hana.mostafa", "I-MATH": "hala.hassan", "I-ENG": "dina.adel" } as Record<string, string>)[instructorId] + "@university.example";
