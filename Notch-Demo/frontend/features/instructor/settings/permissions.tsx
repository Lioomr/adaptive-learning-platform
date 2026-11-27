"use client";
import { useState } from "react";
import { Check, Minus, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NativeSelect, TextArea } from "@/features/instructor/portal/forms";
import { Modal } from "@/features/instructor/coursework/modal";
import { Notice } from "./controls";
import { PERMS, ROLES, grantNote, grantedBy, grants, roleLabel, roleRank, type Grant, type PermId, type RoleId } from "./data";
import type { Sp } from "./use-settings";

/** "Request access" button plus its dialog. The request is recorded, never auto-approved. */
export function RequestAccess({ p, perm }: { p: Sp; perm: PermId }) {
  const { t, saved, course, role } = p;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const pending = saved.requests.find((r) => r.courseId === course.id && r.perm === perm);
  const label = PERMS.find((x) => x.id === perm)!.label;
  if (pending) return <Badge tone="progress">{t("Requested · pending", "تم الطلب · قيد الانتظار")}</Badge>;
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => { setOpen(true); setErr(""); }} aria-label={t(`Request access: ${label[0]}`, `طلب صلاحية: ${label[1]}`)}>{t("Request access", "طلب صلاحية")}</Button>
      <Modal open={open} onOpenChange={setOpen} title={t("Request access", "طلب صلاحية")} description={`${course.code} · ${t(label)}`}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>{t("Cancel", "إلغاء")}</Button><Button onClick={() => { if (reason.trim().length < 10) { setErr(t("Please explain why you need this (at least 10 characters).", "يرجى توضيح سبب حاجتك (10 أحرف على الأقل).")); return; } p.request(perm, reason.trim()); setOpen(false); setReason(""); }}>{t("Send request (demo)", "إرسال الطلب (عرض)")}</Button></>}>
        <p className="text-sm text-muted-foreground">{t(`Your request goes to ${grantedBy[role][0]}, who decides. Nothing changes until they approve it.`, `يذهب طلبك إلى ${grantedBy[role][1]} الذي يقرر. لا يتغير شيء حتى يوافق.`)}</p>
        <label className="grid gap-1.5 text-sm font-medium">{t("Reason", "السبب")}<TextArea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      </Modal>
    </>
  );
}

const icon = (g: Grant) => (g === "yes" ? <Check className="size-4 text-success-ink" aria-label="Allowed" /> : g === "limited" ? <Minus className="size-4 text-warning-ink" aria-label="Limited" /> : <X className="size-4 text-muted-foreground" aria-label="Not allowed" />);

export function PermissionsSection({ p }: { p: Sp }) {
  const { t, assigned, course, role, rank, cfg, update, saved, pick } = p;
  const mine = grants[role];
  const gTone = { yes: "success", limited: "warning", no: "neutral" } as const;
  const gLabel = { yes: t("Allowed", "مسموح"), limited: t("Limited", "محدود"), no: t("Not allowed", "غير مسموح") };
  const team = cfg.team[course.id] ?? [];
  const canManage = rank >= 2;
  const options = ROLES.filter((r) => roleRank[r] < rank);
  const reqs = saved.requests;
  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-64 flex-1 gap-1 text-xs text-muted-foreground">{t("Course", "المقرر")}<NativeSelect value={course.id} onChange={(e) => p.setCourse(e.target.value)}>{assigned.map((c) => <option key={c.id} value={c.id}>{c.code} · {t(c.title)} — {t(roleLabel[p.cfg.team[c.id]?.find((m) => m.you)?.role ?? "ta"])}</option>)}</NativeSelect></label>
          <div className="pb-1 text-sm"><span className="text-muted-foreground">{t("Your role", "دورك")}: </span><Badge tone="brand"><ShieldCheck aria-hidden="true" />{t(roleLabel[role])}</Badge></div>
        </div>
        <Notice>{t("Roles are assigned by your department, and you cannot change your own role here. Nobody can grant themselves administrator permissions.", "يعيّن قسمك الأدوار، ولا يمكنك تغيير دورك هنا. لا يمكن لأحد منح نفسه صلاحيات المسؤول.")}</Notice>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-start text-sm">
          <caption className="p-4 pb-2 text-start text-base font-semibold">{t(`What you can do in ${course.code}`, `ما يمكنك فعله في ${course.code}`)}</caption>
          <thead className="bg-muted/60"><tr>{[t("Permission", "الصلاحية"), t("Status", "الحالة"), t("Details", "التفاصيل"), ""].map((h, i) => <th key={i} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>{PERMS.map((x) => { const g = mine[x.id]; return (
            <tr key={x.id} className="border-t align-top">
              <th scope="row" className="p-3 text-start font-medium">{t(x.label)}<span className="block text-xs font-normal text-muted-foreground">{t(x.desc)}</span></th>
              <td className="p-3"><Badge tone={gTone[g]}>{gLabel[g]}</Badge></td>
              <td className="p-3 text-muted-foreground">{g === "no" ? t(`Not included in your role. Ask ${grantedBy[role][0]}.`, `غير مشمولة في دورك. اطلب من ${grantedBy[role][1]}.`) : grantNote[role]?.[x.id] ? t(grantNote[role]![x.id]!) : "—"}</td>
              <td className="p-3">{g !== "yes" && <RequestAccess p={p} perm={x.id} />}</td>
            </tr>); })}</tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-center text-sm">
          <caption className="p-4 pb-2 text-start text-base font-semibold">{t("What each role can do", "ما يمكن لكل دور فعله")}</caption>
          <thead className="bg-muted/60"><tr><th scope="col" className="p-3 text-start font-medium text-muted-foreground">{t("Permission", "الصلاحية")}</th>{ROLES.map((r: RoleId) => <th key={r} scope="col" className={cn("p-3 font-medium", r === role ? "text-primary" : "text-muted-foreground")}>{t(roleLabel[r])}{r === role && <span className="block text-[11px]">({t("you", "أنت")})</span>}</th>)}</tr></thead>
          <tbody>{PERMS.map((x) => <tr key={x.id} className="border-t"><th scope="row" className="p-3 text-start font-normal">{t(x.label)}</th>{ROLES.map((r) => <td key={r} className={cn("p-3", r === role && "bg-secondary/40")}><span className="inline-flex justify-center">{icon(grants[r][x.id])}</span></td>)}</tr>)}</tbody>
        </table>
        <p className="flex flex-wrap gap-x-4 gap-y-1 p-4 pt-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1">{icon("yes")}{t("Allowed", "مسموح")}</span><span className="inline-flex items-center gap-1">{icon("limited")}{t("Limited", "محدود")}</span><span className="inline-flex items-center gap-1">{icon("no")}{t("Not allowed", "غير مسموح")}</span></p>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">{t("Teaching team", "فريق التدريس")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{canManage ? t("As a coordinator you can assign roles below your own. The Department Administrator role cannot be granted here.", "بصفتك منسّقًا يمكنك تعيين أدوار أدنى من دورك. لا يمكن منح دور مسؤول القسم من هنا.") : t("Only a Course Coordinator or Department Administrator can change team roles.", "يمكن لمنسّق المقرر أو مسؤول القسم فقط تغيير أدوار الفريق.")}</p>
        <ul className="mt-4 divide-y">{team.map((m) => {
          const editable = canManage && !m.you && roleRank[m.role] < rank;
          return (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span className="font-medium">{m.you ? `${pick(p.cfg.profile.name)} ` : `${pick(m.name)} `}{m.you && <Badge tone="brand">{t("You", "أنت")}</Badge>}</span>
              {editable ? <NativeSelect aria-label={t(`Role for ${m.name[0]}`, `دور ${m.name[1]}`)} className="h-10 w-64" value={m.role} onChange={(e) => update((s) => { s.team[course.id] = s.team[course.id].map((x) => (x.id === m.id ? { ...x, role: e.target.value as RoleId } : x)); return s; })}>{[...options, ...(options.includes(m.role) ? [] : [m.role])].map((r) => <option key={r} value={r} disabled={!options.includes(r)}>{t(roleLabel[r])}</option>)}</NativeSelect>
                : <span className="flex items-center gap-2"><Badge tone="neutral">{t(roleLabel[m.role])}</Badge><span className="text-xs text-muted-foreground">{m.you ? t("You cannot change your own role.", "لا يمكنك تغيير دورك.") : !canManage ? t("View only", "للعرض فقط") : t("Same or higher than your role", "مساوٍ لدورك أو أعلى")}</span></span>}
            </li>);
        })}</ul>
      </Card>

      {reqs.length > 0 && (
        <Card className="p-5 sm:p-6"><h2 className="text-lg font-semibold tracking-tight">{t("Your access requests", "طلبات الصلاحية الخاصة بك")}</h2>
          <ul className="mt-3 divide-y text-sm">{reqs.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span><strong>{t(PERMS.find((x) => x.id === r.perm)!.label)}</strong> · {assigned.find((c) => c.id === r.courseId)?.code}<span className="block text-xs text-muted-foreground">{r.reason}</span></span><span className="flex items-center gap-2"><Badge tone="progress">{t("Pending", "قيد الانتظار")}</Badge><Button size="sm" variant="ghost" onClick={() => p.cancelRequest(r.id)}>{t("Cancel request", "إلغاء الطلب")}</Button></span></li>)}</ul></Card>
      )}
    </div>
  );
}
