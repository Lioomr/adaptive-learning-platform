"use client";
import { useState } from "react";
import { KeyRound, Lock, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextArea, TextInput } from "@/features/instructor/portal/forms";
import { Modal } from "@/features/instructor/coursework/modal";
import { Notice, Panel, SettingRow, Toggle } from "./controls";
import { emailOf } from "./data";
import type { Sp } from "./use-settings";

export function ProfileSection({ p }: { p: Sp }) {
  const { t, id, cfg, update, pick, instructor, language } = p;
  const pr = cfg.profile;
  const [photoError, setPhotoError] = useState("");
  const [pwd, setPwd] = useState(false);
  const initials = pick(pr.name).replace(/^(Dr\.|د\.)\s*/, "").slice(0, 1);
  const onPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError(t("Choose an image file (PNG or JPG).", "اختر ملف صورة (PNG أو JPG).")); return; }
    if (file.size > 400 * 1024) { setPhotoError(t("The photo must be under 400 KB.", "يجب أن تقل الصورة عن 400 كيلوبايت.")); return; }
    const r = new FileReader();
    r.onload = () => { setPhotoError(""); update((s) => { s.profile.photo = String(r.result); return s; }); };
    r.readAsDataURL(file);
  };
  return (
    <div className="space-y-6">
      <Panel title={t("Profile", "الملف الشخصي")} description={t("How you appear to students and colleagues.", "كيف تظهر للطلاب والزملاء.")}>
        <SettingRow label={t("Profile photo", "صورة الملف الشخصي")} description={t("PNG or JPG, under 400 KB. Stored in this browser only (demo).", "PNG أو JPG بحجم أقل من 400 كيلوبايت. تُحفظ في هذا المتصفح فقط (عرض).")}>
          <div className="flex items-center gap-3">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border bg-secondary text-xl font-semibold text-primary">{pr.photo ? <span role="img" aria-label={t("Your profile photo", "صورة ملفك الشخصي")} className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${pr.photo})` }} /> : initials}</span>
            <div className="flex flex-col gap-2">
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium focus-within:ring-2 focus-within:ring-ring hover:bg-secondary"><Upload className="size-4" aria-hidden="true" />{t("Update photo", "تحديث الصورة")}<input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={(e) => { onPhoto(e.target.files?.[0]); e.target.value = ""; }} /></label>
              {pr.photo && <Button size="sm" variant="ghost" className="text-danger" onClick={() => update((s) => { s.profile.photo = null; return s; })}><Trash2 aria-hidden="true" />{t("Remove photo", "إزالة الصورة")}</Button>}
            </div>
          </div>
          {photoError && <p role="alert" className="mt-2 text-sm text-danger">{photoError}</p>}
        </SettingRow>
        <SettingRow label={t("Name (English)", "الاسم (بالإنجليزية)")} htmlFor="pn-en"><TextInput id="pn-en" maxLength={60} value={pr.name[0]} onChange={(e) => update((s) => { s.profile.name = [e.target.value, s.profile.name[1]]; return s; })} /></SettingRow>
        <SettingRow label={t("Name (Arabic)", "الاسم (بالعربية)")} htmlFor="pn-ar"><TextInput id="pn-ar" dir="rtl" maxLength={60} value={pr.name[1]} onChange={(e) => update((s) => { s.profile.name = [s.profile.name[0], e.target.value]; return s; })} /></SettingRow>
        <SettingRow label={t("Short bio", "نبذة قصيرة")} description={t("Optional. Shown on your course pages.", "اختياري. تظهر في صفحات مقرراتك.")} htmlFor="pn-bio"><TextArea id="pn-bio" rows={3} maxLength={280} value={pr.bio} onChange={(e) => update((s) => { s.profile.bio = e.target.value; return s; })} /></SettingRow>
        <SettingRow label={t("Office hours", "الساعات المكتبية")} htmlFor="pn-oh"><TextInput id="pn-oh" maxLength={80} value={pr.office} onChange={(e) => update((s) => { s.profile.office = e.target.value; return s; })} /></SettingRow>
      </Panel>

      <Panel title={t("Managed by the university", "تديرها الجامعة")} description={t("These come from the university directory. Contact your department to change them.", "تأتي هذه من دليل الجامعة. تواصل مع قسمك لتغييرها.")}>
        <SettingRow label={t("Email", "البريد الإلكتروني")} locked htmlFor="pn-email"><TextInput id="pn-email" readOnly value={emailOf(id)} /></SettingRow>
        <SettingRow label={t("Department", "القسم")} locked htmlFor="pn-dep"><TextInput id="pn-dep" readOnly value={pick(instructor.title)} /></SettingRow>
        <SettingRow label={t("Academic role", "الدور الأكاديمي")} locked htmlFor="pn-role"><TextInput id="pn-role" readOnly value={language === "ar" ? "أستاذ مشارك" : "Associate Professor"} /></SettingRow>
      </Panel>

      <Panel title={t("Account preferences", "تفضيلات الحساب")}>
        <SettingRow label={t("Show my profile to students", "إظهار ملفي الشخصي للطلاب")} description={t("Students can see your name, photo and bio on course pages.", "يرى الطلاب اسمك وصورتك ونبذتك في صفحات المقرر.")}><Toggle checked={pr.showProfile} label={t("Show my profile to students", "إظهار ملفي الشخصي للطلاب")} onChange={(v) => update((s) => { s.profile.showProfile = v; return s; })} /></SettingRow>
        <SettingRow label={t("Show office hours to students", "إظهار الساعات المكتبية للطلاب")}><Toggle checked={pr.showOffice} label={t("Show office hours to students", "إظهار الساعات المكتبية للطلاب")} onChange={(v) => update((s) => { s.profile.showOffice = v; return s; })} /></SettingRow>
        <SettingRow label={t("Keep me signed in on this device", "إبقائي مسجَّل الدخول على هذا الجهاز")} description={t("Only use on a device you trust. (Demo setting.)", "استخدمه على جهاز موثوق فقط. (إعداد تجريبي.)")}><Toggle checked={pr.keepSignedIn} label={t("Keep me signed in on this device", "إبقائي مسجَّل الدخول على هذا الجهاز")} onChange={(v) => update((s) => { s.profile.keepSignedIn = v; return s; })} /></SettingRow>
        <SettingRow label={t("Password", "كلمة المرور")} description={t("Passwords are changed in the university account system, never on this page.", "تُغيَّر كلمات المرور في نظام حساب الجامعة وليس في هذه الصفحة.")}><Button variant="outline" onClick={() => setPwd(true)}><KeyRound aria-hidden="true" />{t("Change password", "تغيير كلمة المرور")}</Button></SettingRow>
      </Panel>
      <Notice><Lock className="me-1.5 inline size-3.5" aria-hidden="true" />{t("Sensitive information, such as passwords and national ID numbers, is never shown or stored here.", "لا تُعرض هنا أو تُخزَّن معلومات حساسة مثل كلمات المرور وأرقام الهوية.")}</Notice>

      <Modal open={pwd} onOpenChange={setPwd} title={t("Change your password", "تغيير كلمة المرور")} description={t("This opens the university account portal.", "يفتح هذا بوابة حساب الجامعة.")}
        footer={<><Button variant="outline" onClick={() => setPwd(false)}>{t("Cancel", "إلغاء")}</Button><Button onClick={() => { setPwd(false); p.setNotice({ tone: "ok", text: t("Opened the university account portal (demo). Nothing was entered here.", "تم فتح بوابة حساب الجامعة (عرض). لم يُدخل شيء هنا.") }); }}>{t("Open account portal (demo)", "فتح بوابة الحساب (عرض)")}</Button></>}>
        <p className="text-sm text-muted-foreground">{t("For your security, you will sign in with your university single sign-on and set a new password there. This app never sees your password.", "لأمانك، ستسجّل الدخول بحساب الجامعة الموحد وتضبط كلمة مرور جديدة هناك. لا يرى هذا التطبيق كلمة مرورك أبدًا.")}</p>
      </Modal>
    </div>
  );
}
