import type { Role } from "@/types";

/**
 * Centralized route contract. Portal screens (ST/IN/AD/SYS) are added as nested
 * routes under these paths and inherit the portal layout, which fixes the role.
 */
export const routes = { demo: "/demo", student: "/student", instructor: "/instructor", advisor: "/advisor" } as const satisfies Record<Role, string>;

export type PortalMeta = {
  role: Role;
  href: string;
  label: string;
  /** Short label for compact navigation. */
  short: string;
  description: string;
  screens: string;
};

export const portals: readonly PortalMeta[] = [
  { role: "demo", href: routes.demo, label: "Demo Control Center", short: "Control Center", description: "Choose a fictional student and course, run the guided tour and reset the demo.", screens: "Presenter tools" },
  { role: "student", href: routes.student, label: "Student Portal", short: "Student", description: "Practice, see concept mastery and follow prerequisite recommendations.", screens: "ST1–ST21" },
  { role: "instructor", href: routes.instructor, label: "Instructor Portal", short: "Instructor", description: "Review course mastery, student progress and recent assessment activity.", screens: "IN1–IN19" },
  { role: "advisor", href: routes.advisor, label: "Advisor Portal", short: "Advisor", description: "Follow cross-course progress and supportive check-in indicators.", screens: "AD1–AD6" },
];

export const portalFor = (role: Role) => portals.find(p => p.role === role)!;

/** Used for navigation highlighting only. Permissions use the layout-provided role. */
export function roleForPath(pathname: string): Role {
  const segment = pathname.split("/")[1];
  return segment === "student" || segment === "instructor" || segment === "advisor" ? segment : "demo";
}
