import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Layout-matched loading placeholders. Each mirrors the grid and card heights of
 * the content it replaces so nothing shifts when data arrives. The shimmer stops
 * under prefers-reduced-motion (globals.css) and disappears as soon as the store
 * hydrates — there are no artificial delays.
 */
function Status({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function CardSkeleton({ className, lines = 3, header = true, block }: { className?: string; lines?: number; header?: boolean; block?: string }) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      {header ? (
        <div className="mb-5 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
      ) : null}
      {block ? <Skeleton className={cn("w-full rounded-lg", block)} /> : null}
      <div className={cn("space-y-3", block && "mt-4")}>
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn("h-3", i % 3 === 2 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </Card>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="min-h-[132px] p-5">
          <div className="flex items-start justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
          <Skeleton className="mt-3 h-7 w-20" />
          <Skeleton className="mt-3 h-3 w-36" />
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="p-5 sm:p-6">
      <Skeleton className="mb-5 h-4 w-44" />
      <div className="space-y-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="hidden h-3 w-24 sm:block" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StudentPreviewSkeleton() {
  return (
    <Status label="Loading the student learning space" className="space-y-6">
      <Card className="flex flex-col gap-6 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-3 w-80 max-w-full" />
          <Skeleton className="h-10 w-44 rounded-lg" />
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="size-24 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <CardSkeleton lines={2} block="h-10" />
          <CardSkeleton lines={0} block="h-[232px]" />
        </div>
        <div className="space-y-6 xl:col-span-4">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
      </div>
      <CardSkeleton lines={8} />
    </Status>
  );
}

export function InstructorPreviewSkeleton() {
  return (
    <Status label="Loading the course overview" className="space-y-6">
      <StatGridSkeleton />
      <div className="grid gap-6 xl:grid-cols-12">
        <CardSkeleton className="xl:col-span-7" lines={0} block="h-[324px]" />
        <CardSkeleton className="xl:col-span-5" lines={0} block="h-[220px]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8"><TableSkeleton rows={8} /></div>
        <div className="space-y-6 xl:col-span-4">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={4} />
        </div>
      </div>
    </Status>
  );
}

export function AdvisorPreviewSkeleton() {
  return (
    <Status label="Loading the advisor caseload" className="space-y-6">
      <StatGridSkeleton />
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7"><TableSkeleton rows={8} /></div>
        <div className="space-y-6 xl:col-span-5">
          <CardSkeleton lines={6} />
        </div>
      </div>
      <CardSkeleton lines={0} block="h-[436px]" />
    </Status>
  );
}

export function DemoCenterSkeleton() {
  return (
    <Status label="Loading the demo context" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-12">
        <CardSkeleton className="xl:col-span-7" lines={3} block="h-10" />
        <CardSkeleton className="xl:col-span-5" lines={5} />
      </div>
    </Status>
  );
}
