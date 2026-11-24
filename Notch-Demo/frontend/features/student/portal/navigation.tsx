"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, House, LayoutDashboard, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShellCopy } from "@/components/layout/shell-copy";
const links = [
  { href: "/student", label: "Home", icon: House },
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/courses", label: "Courses", icon: BookOpen },
  { href: "/student/chatbot", label: "Chatbot", icon: MessageCircle },
];
export function StudentNavigation({
  drawer = false,
  onNavigate,
}: {
  drawer?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { text } = useShellCopy();
  return (
    <ul className="grid gap-2">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/student" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={text(label)}
              className={cn(
                "relative flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-strong",
                active && "bg-sidebar-active text-secondary-foreground",
                !drawer &&
                  "md:max-lg:justify-center md:max-lg:px-0 lg:group-data-[collapsed=true]/sidebar:justify-center lg:group-data-[collapsed=true]/sidebar:px-0",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span
                className={cn(
                  !drawer &&
                    "md:max-lg:sr-only lg:group-data-[collapsed=true]/sidebar:sr-only",
                )}
              >
                {text(label)}
              </span>
              {active && (
                <span
                  className="absolute inset-y-3 start-0 w-[3px] rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
