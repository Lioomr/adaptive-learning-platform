"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, ClipboardCheck, ClipboardList, FileStack, FileText, LayoutDashboard, Library, MessageCircle, MessagesSquare, Settings, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShellCopy } from "@/components/layout/shell-copy";
import { useWork } from "@/features/instructor/coursework/store";
import { useOverview } from "@/features/instructor/dashboard/hooks";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: "approvals" | "messages" };
const main: Item[] = [
  { href: "/instructor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/instructor/courses", label: "My Courses", icon: BookOpen },
  { href: "/instructor/approvals", label: "Pending Approvals", icon: ClipboardCheck, badge: "approvals" },
  { href: "/instructor/student-management", label: "Students", icon: Users },
  { href: "/instructor/coursework", label: "Coursework", icon: MessagesSquare, badge: "messages" },
  { href: "/instructor/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/instructor/analytics", label: "Learning Analytics", icon: BarChart3 },
  { href: "/instructor/reports", label: "Reports", icon: FileText },
  { href: "/instructor/preferences", label: "Settings", icon: Settings },
];
const tools: Item[] = [
  { href: "/instructor/semester", label: "Semester Preparation", icon: FileStack },
  { href: "/instructor/question-bank", label: "Question Bank", icon: Library },
  { href: "/instructor/chatbot", label: "Chatbot", icon: MessageCircle },
];

function MessageBadge() {
  const { assigned } = useOverview();
  const n = useWork((s) => s.threads.filter((x) => x.unread && !x.resolved && assigned.some((c) => c.id === x.courseId)).length);
  if (!n) return null;
  return <span className="ms-auto rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white md:max-lg:hidden lg:group-data-[collapsed=true]/sidebar:hidden" aria-label={`${n} unread`}>{n}</span>;
}

function ApprovalBadge() {
  const { pending } = useOverview();
  if (!pending.length) return null;
  return <span className="ms-auto rounded-full bg-warning px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white md:max-lg:hidden lg:group-data-[collapsed=true]/sidebar:hidden">{pending.length}</span>;
}

/** Instructor sidebar. Same styling as the Student sidebar; Learning Analytics opens the instructor analytics workspace. */
export function InstructorNavigation({ drawer = false, onNavigate }: { drawer?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { text } = useShellCopy();
  const render = (items: Item[]) => items.map(({ href, label, icon: Icon, exact, badge }) => {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <li key={`${href}-${label}`}>
        <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={text(label)}
          className={cn("relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-strong", active && "bg-sidebar-active text-secondary-foreground", !drawer && "md:max-lg:justify-center md:max-lg:px-0 lg:group-data-[collapsed=true]/sidebar:justify-center lg:group-data-[collapsed=true]/sidebar:px-0")}>
          <Icon className="size-5 shrink-0" aria-hidden="true" />
          <span className={cn(!drawer && "md:max-lg:sr-only lg:group-data-[collapsed=true]/sidebar:sr-only")}>{text(label)}</span>
          {badge === "approvals" && <ApprovalBadge />}
          {badge === "messages" && <MessageBadge />}
          {active && <span className="absolute inset-y-3 start-0 w-[3px] rounded-full bg-primary" aria-hidden="true" />}
        </Link>
      </li>
    );
  });
  return (
    <div>
      <ul className="grid gap-1">{render(main)}</ul>
      <p className={cn("mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted", !drawer && "md:max-lg:sr-only lg:group-data-[collapsed=true]/sidebar:sr-only")}>{text("Course tools")}</p>
      <ul className="grid gap-1">{render(tools)}</ul>
    </div>
  );
}
