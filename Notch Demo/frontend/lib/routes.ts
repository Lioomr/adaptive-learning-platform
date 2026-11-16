import type { Role } from "@/types";
export const routes = { demo: "/demo", student: "/student", instructor: "/instructor", advisor: "/advisor" } as const satisfies Record<Role, string>;
export function roleForPath(pathname: string): Role { const segment = pathname.split("/")[1]; return segment === "student" || segment === "instructor" || segment === "advisor" ? segment : "demo"; }
