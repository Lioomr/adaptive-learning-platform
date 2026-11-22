"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Languages, LockKeyhole, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InterfaceLanguage = "en" | "ar";
type QuestionLanguage = "en" | "ar" | "both";
type Preferences = { interfaceLanguage: InterfaceLanguage; questionLanguage: QuestionLanguage };

const STORAGE_KEY = "notch-student-preferences";
const DEFAULTS: Preferences = { interfaceLanguage: "en", questionLanguage: "en" };

function readPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const value = JSON.parse(raw) as Record<string, unknown>;
    return {
      interfaceLanguage: value.interfaceLanguage === "ar" ? "ar" : "en",
      questionLanguage: value.questionLanguage === "ar" || value.questionLanguage === "both" ? value.questionLanguage : "en",
    };
  } catch {
    return DEFAULTS;
  }
}

export function StudentSettings() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [requestPreview, setRequestPreview] = useState(false);
  const ar = preferences.interfaceLanguage === "ar";
  const tr = (en: string, arabic: string) => ar ? arabic : en;

  useEffect(() => {
    setPreferences(readPreferences());
    setHydrated(true);
  }, []);

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      window.dispatchEvent(new Event("notch-preferences-changed"));
      setSaved(true);
      setError("");
    } catch {
      setSaved(false);
      setError(tr("Your browser could not save these preferences.", "المتصفح لم يتمكن من حفظ التفضيلات."));
    }
  }

  return (
    <div lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"} className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st17"><ArrowLeft className="me-2 size-4 rtl:-scale-x-100" />{tr("Back to tutor", "العودة للمساعد التعليمي")}</Link></Button>
        <span className="text-sm text-muted-foreground">ST18 · {tr("Settings", "الإعدادات")}</span>
      </div>

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Settings2 className="size-4" />{tr("Your learning experience", "تجربة التعلم الخاصة بك")}</div>
        <h1 className="notch-page-title">{tr("Settings", "الإعدادات")}</h1>
        <p className="max-w-2xl text-muted-foreground">{tr("Manage your language preferences and review how privacy controls work in this demo.", "تحكمي في تفضيلات اللغة وراجعي طريقة عمل إعدادات الخصوصية في هذا العرض التجريبي.")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Languages className="size-5" />{tr("Language preferences", "تفضيلات اللغة")}</CardTitle>
          <CardDescription>{tr("These values use the same browser preference record as the initial preferences screen (ST3).", "الإعدادات دي بتستخدم نفس سجل التفضيلات المحفوظ في المتصفح من شاشة التفضيلات الأولى ST3.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!hydrated ? <div className="h-20 animate-pulse rounded-lg bg-muted" /> : <>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">{tr("Interface language", "لغة واجهة المنصة")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["en", "ar"] as const).map(value => <button key={value} type="button" aria-pressed={preferences.interfaceLanguage === value} onClick={() => { setPreferences(p => ({ ...p, interfaceLanguage: value })); setSaved(false); }} className={`rounded-xl border p-4 text-start ${preferences.interfaceLanguage === value ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
                  <span className="font-medium">{value === "en" ? "English" : "العربية"}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{value === "en" ? "Left-to-right" : "من اليمين إلى اليسار"}</span>
                </button>)}
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">{tr("Question language", "لغة الأسئلة")}</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {([{value:"en",label:tr("English","الإنجليزية")},{value:"ar",label:tr("Arabic","العربية")},{value:"both",label:tr("Both languages","اللغتان معًا")}] as const).map(option => <button key={option.value} type="button" aria-pressed={preferences.questionLanguage === option.value} onClick={() => { setPreferences(p => ({ ...p, questionLanguage: option.value })); setSaved(false); }} className={`rounded-xl border p-4 text-start font-medium ${preferences.questionLanguage === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>{option.label}</button>)}
              </div>
            </fieldset>
            <Button onClick={save}>{tr("Save preferences", "حفظ التفضيلات")}</Button>
            {saved && <p role="status" className="flex items-center gap-2 text-sm text-success-ink"><CheckCircle2 className="size-4" />{tr("Preferences saved in this browser.", "تم حفظ التفضيلات في هذا المتصفح.")}</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />{tr("Privacy and consent", "الخصوصية والموافقة")}</CardTitle>
          <CardDescription>{tr("A transparent preview of the controls planned for the student experience.", "معاينة توضيحية لعناصر التحكم الخاصة بالخصوصية في تجربة الطالب.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <LockKeyhole className="mt-0.5 size-5 text-muted-foreground" />
            <div><p className="font-medium">{tr("Learning data in this demo", "بيانات التعلم في الديمو")}</p><p className="mt-1 text-sm text-muted-foreground">{tr("Assessment attempts and mastery are stored in this browser's local demo state. They are not sent to a production server.", "محاولات التقييم ومستوى الإتقان محفوظين في حالة تجريبية محلية داخل المتصفح، ومش بيتم إرسالهم لسيرفر إنتاجي.")}</p></div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <ShieldCheck className="mt-0.5 size-5 text-muted-foreground" />
            <div><p className="font-medium">{tr("Consent controls", "إعدادات الموافقة")}</p><p className="mt-1 text-sm text-muted-foreground">{tr("Your consent choices are not connected to a consent-management service in this prototype. No consent status is changed here.", "اختيارات الموافقة مش متصلة بخدمة لإدارة الموافقات في النموذج التجريبي ده، ومفيش حالة موافقة بتتغير من هنا.")}</p></div>
          </div>
          <div className="rounded-lg border border-dashed p-4">
            <div className="flex items-center gap-2 font-medium"><Trash2 className="size-4" />{tr("Request data deletion", "طلب حذف البيانات")}</div>
            <p className="mt-1 text-sm text-muted-foreground">{tr("Preview the request flow. This button does not submit a real request or delete browser data.", "دي معاينة لخطوات الطلب فقط. الزر مش بيبعت طلب حقيقي ومش بيحذف بيانات المتصفح.")}</p>
            <Button className="mt-3" variant="outline" onClick={() => setRequestPreview(value => !value)}>{requestPreview ? tr("Close preview", "إغلاق المعاينة") : tr("Preview deletion request", "معاينة طلب الحذف")}</Button>
            {requestPreview && <div role="status" className="mt-3 rounded-lg bg-muted/50 p-3 text-sm"><p className="font-medium">{tr("Request preview", "معاينة الطلب")}</p><p className="mt-1 text-muted-foreground">{tr("A real service would verify your identity, explain which data is covered, ask for confirmation, and provide a request reference. None of those actions are performed in this demo.", "الخدمة الحقيقية هتتحقق من هويتك، وتوضح البيانات المشمولة، وتطلب التأكيد، وتوفر رقم متابعة. ولا خطوة من دول بتتنفذ في الديمو.")}</p></div>}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href="/student/st17">{tr("Back to tutor", "العودة للمساعد التعليمي")}</Link></Button>
        <Button asChild><Link href="/student/st19">{tr("Continue to post-test", "الانتقال للاختبار البعدي")}</Link></Button>
      </div>
      <p className="text-xs text-muted-foreground">{tr("Prototype limitation: settings are browser-local. Interface language is saved for reuse by screens that read the ST3 preference record; this screen does not force every existing screen to switch language automatically.", "حدود النموذج: الإعدادات محفوظة محليًا في المتصفح. لغة الواجهة متاحة للشاشات اللي بتقرأ سجل تفضيلات ST3؛ الشاشة دي مش بتجبر كل الشاشات الحالية على تغيير اللغة تلقائيًا.")}</p>
    </div>
  );
}
