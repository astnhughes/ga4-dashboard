import { KPIData } from '@shared/types';

interface KPICardProps {
  kpi: KPIData;
  accentColor: string;
}

export function KPICard({ kpi, accentColor }: KPICardProps) {
  const yoy = kpi.yoyChange;
  const isPositive = yoy !== undefined && yoy > 0;
  const isNegative = yoy !== undefined && yoy < 0;

  return (
    <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5 hover:border-dashboard-card-hover transition-colors">
      <p className="text-sm text-dashboard-text-muted mb-1">{kpi.label}</p>
      <p className="text-3xl font-bold text-dashboard-text-primary mb-2">
        {kpi.formattedValue}
      </p>
      {yoy !== undefined && (
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-success/15 text-success'
                : isNegative
                ? 'bg-danger/15 text-danger'
                : 'bg-dashboard-border text-dashboard-text-muted'
            }`}
          >
            {isPositive ? '+' : ''}
            {yoy.toFixed(1)}%
          </span>
          <span className="text-xs text-dashboard-text-muted">vs last year</span>
        </div>
      )}
      <div
        className="mt-3 h-0.5 rounded-full opacity-30"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  );
}
