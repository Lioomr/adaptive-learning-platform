import type { HTMLAttributes } from "react";
export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) { return <div aria-hidden="true" className={`skeleton ${className}`} {...props} />; }
export function PageSkeleton() { return <main className="loading" aria-busy="true" aria-label="Loading workspace"><Skeleton /><div className="grid stats skeleton-grid"><Skeleton className="skeleton-card"/><Skeleton className="skeleton-card"/><Skeleton className="skeleton-card"/></div><Skeleton className="large"/></main>; }
