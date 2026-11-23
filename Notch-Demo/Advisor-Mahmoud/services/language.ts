import { concepts, courses } from "@/data/fixtures";
import type { Language } from "./advisor";
const arabic: Record<string, string> = {
  "C-PY": "مقدمة في بايثون",
  "C-MATH": "الرياضيات",
  all: "المقرران معاً",
  "PY-VAR": "المتغيرات",
  "PY-TYPE": "أنواع البيانات",
  "PY-OP": "المعاملات",
  "PY-COND": "الشروط",
  "PY-LOOP": "الحلقات",
  "PY-FUNC": "الدوال",
  "PY-LIST": "القوائم",
  "PY-DICT": "القواميس",
  "PY-STACK": "مكدس الاستدعاءات",
  "PY-REC": "الاستدعاء الذاتي",
  "MA-ARITH": "أساسيات الحساب",
  "MA-EXPR": "التعبيرات الجبرية",
  "MA-LIN": "المعادلات الخطية",
  "MA-INEQ": "المتباينات",
  "MA-FUNC": "الدوال",
  "MA-GRAPH": "الرسوم البيانية",
  "MA-QUAD": "المعادلات التربيعية",
  "MA-LIMIT": "النهايات",
  "MA-DERIV": "المشتقات",
  "MA-APP": "تطبيقات المشتقات",
  Nour: "نور",
  Ahmed: "أحمد",
  Salma: "سلمى",
  Youssef: "يوسف",
  Mariam: "مريم",
  Laila: "ليلى",
  Omar: "عمر",
  Farah: "فرح",
  Karim: "كريم",
  Hana: "هنا",
  "Needs Support": "يحتاج إلى دعم",
  Developing: "قيد التطور",
  Proficient: "متمكن",
  Mastered: "متقن",
};
export function nameOf(id: string, lang: Language) {
  if (lang === "ar" && arabic[id]) return arabic[id];
  return (
    concepts.find((c) => c.id === id)?.title ??
    courses.find((c) => c.id === id)?.title ??
    (id === "all" ? "Both courses" : id)
  );
}
export const templates = [
  {
    id: "checkin",
    en: "A friendly check-in",
    ar: "اطمئنان ودّي",
    text: {
      en: "Hi {name}, how is your learning going? Let’s find a manageable next step together. I’m here if you would like support.",
      ar: "مرحباً {name}، كيف تسير دراستك؟ لنحدد معاً خطوة تالية مناسبة. أنا هنا إذا احتجت إلى دعم.",
    },
  },
  {
    id: "review",
    en: "Review a prerequisite",
    ar: "مراجعة متطلب سابق",
    text: {
      en: "Hi {name}, consider reviewing the prerequisite concepts in your learning plan before your next practice session. We can work through the next step together.",
      ar: "مرحباً {name}، يمكنك مراجعة المفاهيم الأساسية في خطتك قبل التدريب التالي. يمكننا العمل على الخطوة التالية معاً.",
    },
  },
  {
    id: "encourage",
    en: "Encourage progress",
    ar: "تشجيع التقدم",
    text: {
      en: "Hi {name}, thank you for the effort you’re putting into your learning. Keep taking small, steady steps and let me know what support would help.",
      ar: "مرحباً {name}، شكراً لجهدك في التعلم. واصل التقدم بخطوات صغيرة ومنتظمة، وأخبرني بالدعم الذي تحتاجه.",
    },
  },
] as const;
