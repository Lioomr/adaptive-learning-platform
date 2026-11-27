"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import { Bell, ChevronDown, MessageSquareWarning, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { instructorAccounts } from "@/features/instructor/portal/data";
import { useInstructorPortal } from "@/features/instructor/portal/store";
import { useOverview } from "./hooks";
import { useDash } from "./store";
import { useSettings } from "@/features/instructor/settings/store";

const panel = "z-50 min-w-64 max-w-[22rem] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-raised";
const item = "block rounded-lg px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-secondary data-[highlighted]:text-primary";
/** The mock tutor "detects" its first new out-of-bound question once per session after this delay. */
const FIRST_ARRIVAL_MS = 25000;
let armed = false;

/** Notifications, new-question toast and profile menu for the instructor top bar. */
export function InstructorTopbarExtras() {
  const { t, num, language, instructor, pending, openRisks, issues, oob, events, assigned } = useOverview();
  const notices = useDash((s) => s.notices);
  const oobAll = useDash((s) => s.oob);
  const markRead = useDash((s) => s.markRead);
  // Settings → Notifications: the new-question toast only shows for immediate in-app alerts.
  const oobPref = useSettings((s) => s.saved[instructor.id]?.notifications.items.oob);
  const toastOn = !oobPref || (oobPref.inApp && oobPref.mode === "immediate");
  const setInstructor = useInstructorPortal((s) => s.setInstructor);
  const dir = language === "ar" ? "rtl" : "ltr";
  const [toast, setToast] = useState<{ id: string; text: string; href: string } | null>(null);
  const seen = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (armed) return;
    armed = true;
    const timer = setTimeout(() => useDash.getState().arrive(), FIRST_ARRIVAL_MS);
    return () => { clearTimeout(timer); armed = false; };
  }, []);
  // Only unresolved questions keep a notification, so a handled question never nags again.
  const live = notices.filter((n) => oobAll.find((q) => q.id === n.questionId)?.status === "open" && assigned.some((c) => c.id === n.courseId));
  const label = (courseId: string, questionId: string) => {
    const q = oobAll.find((x) => x.id === questionId);
    const c = assigned.find((x) => x.id === courseId);
    return { q, c };
  };
  useEffect(() => {
    const fresh = live.find((n) => !n.read && !seen.current.has(n.id));
    if (!fresh || !toastOn) return;
    seen.current.add(fresh.id);
    const { q, c } = label(fresh.courseId, fresh.questionId);
    if (!q || !c) return;
    setToast({ id: fresh.id, text: t(`New out-of-bound question in ${c.code}: “${q.question[0]}”`, `سؤال جديد خارج النطاق في ${c.code}: «${q.question[1]}»`), href: `/instructor/out-of-bound?course=${c.id}&q=${q.id}` });
    const timer = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.length, notices, toastOn]);
  const summary = [
    { n: pending.length, href: "/instructor/approvals", en: "items waiting for approval", ar: "عناصر بانتظار الاعتماد" },
    { n: openRisks.length, href: "/instructor/student-management?filter=at-risk", en: "students may need you", ar: "طلاب قد يحتاجون إليك" },
    { n: oob.length, href: "/instructor/out-of-bound", en: "out-of-bound tutor questions", ar: "أسئلة مساعد خارج النطاق" },
    { n: issues.length, href: "/instructor/content-issues", en: "course content issues", ar: "مشكلات محتوى المقررات" },
    { n: Math.min(events.length, 3), href: "/instructor/calendar", en: "deadlines this week", ar: "مواعيد هذا الأسبوع" },
  ].filter((i) => i.n > 0);
  const unread = live.filter((n) => !n.read).length;
  return (
    <>
      <DropdownMenu.Root dir={dir} onOpenChange={(o) => o && markRead()}>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label={unread ? t(`Notifications, ${unread} new`, `الإشعارات، ${num(unread)} جديد`) : t("Notifications", "الإشعارات")}>
            <Bell aria-hidden="true" />
            {unread > 0 && <span className="absolute end-1 top-1 size-2.5 rounded-full bg-danger ring-2 ring-background" aria-hidden="true" />}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className={panel}>
            {live.length > 0 && (
              <>
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("New questions", "أسئلة جديدة")}</p>
                {live.map((n) => {
                  const { q, c } = label(n.courseId, n.questionId);
                  if (!q || !c) return null;
                  return (
                    <DropdownMenu.Item key={n.id} asChild>
                      <Link href={`/instructor/out-of-bound?course=${c.id}&q=${q.id}`} className={item}>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MessageSquareWarning className="size-3.5" aria-hidden="true" />{c.code}</span>
                        <span className="line-clamp-2">{t(q.question)}</span>
                      </Link>
                    </DropdownMenu.Item>
                  );
                })}
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
              </>
            )}
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Needs attention", "يحتاج إلى اهتمام")}</p>
            {summary.map((i) => <DropdownMenu.Item key={i.href} asChild><Link href={i.href} className={item}><strong className="tabular-nums">{num(i.n)}</strong> {t(i.en, i.ar)}</Link></DropdownMenu.Item>)}
            {!summary.length && <p className="px-3 py-4 text-sm text-muted-foreground">{t("You're all caught up.", "لقد أنجزت كل شيء.")}</p>}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <DropdownMenu.Root dir={dir}>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="sm" aria-label={t("Profile menu", "قائمة الملف الشخصي")}>
            <span className="grid size-7 place-items-center rounded-full bg-secondary text-primary"><UserRound className="size-4" aria-hidden="true" /></span>
            <span className="hidden sm:inline">{t(instructor.name)}</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className={panel}>
            <div className="px-3 py-2"><p className="font-semibold">{t(instructor.name)}</p><p className="text-xs text-muted-foreground">{t(instructor.title)}</p></div>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild><Link href="/instructor/preferences" className={item}>{t("Settings", "الإعدادات")}</Link></DropdownMenu.Item>
            <DropdownMenu.Item asChild><Link href="/instructor/courses" className={item}>{t("My Courses", "مقرراتي")}</Link></DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Label className="px-3 py-1.5 text-xs text-muted-foreground">{t("Demo: switch instructor", "عرض: تبديل المدرّس")}</DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={instructor.id} onValueChange={setInstructor}>
              {instructorAccounts.map((a) => <DropdownMenu.RadioItem key={a.id} value={a.id} className={`${item} cursor-pointer data-[state=checked]:font-semibold`}>{t(a.name)}</DropdownMenu.RadioItem>)}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {toast && (
        <div role="status" aria-live="polite" dir={dir} className="fixed bottom-4 end-4 z-[70] flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border bg-card p-4 text-sm shadow-raised">
          <MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-3">{toast.text}</p>
            <Link href={toast.href} onClick={() => setToast(null)} className="mt-2 inline-block font-semibold text-primary hover:underline">{t("Review question", "مراجعة السؤال")}</Link>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setToast(null)} aria-label={t("Dismiss notification", "إغلاق الإشعار")}><X /></Button>
        </div>
      )}
    </>
  );
}
