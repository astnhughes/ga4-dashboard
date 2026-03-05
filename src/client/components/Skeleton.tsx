interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-dashboard-border/50 rounded ${className}`} style={style} />
  );
}

export function SkeletonKPICard() {
  return (
    <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-4 border-l-2 border-l-dashboard-border">
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function SkeletonChart({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className={`w-full rounded-lg`} style={{ height }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
      <Skeleton className="h-4 w-40 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* KPI row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonKPICard />
        <SkeletonKPICard />
        <SkeletonKPICard />
        <SkeletonKPICard />
      </section>

      {/* Chart row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart height={250} />
      </section>

      {/* Table */}
      <SkeletonTable rows={8} />
    </div>
  );
}
