import { StoreDashboardData } from '@shared/types';
import { STORES } from '@shared/constants';
import { KPICard } from '../components/KPICard';
import { IssueCard } from '../components/IssueCard';

interface OverviewProps {
  data: StoreDashboardData;
}

export function Overview({ data }: OverviewProps) {
  const store = STORES[data.storeId];
  const accent = store.accentColor;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard kpi={data.kpis.totalSessions} accentColor={accent} />
          <KPICard kpi={data.kpis.totalUsers} accentColor={accent} />
          <KPICard kpi={data.kpis.totalLeads} accentColor={accent} />
          <KPICard kpi={data.kpis.conversionRate} accentColor={accent} />
        </div>
      </section>

      {/* Callouts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Good Callouts */}
        {data.goodCallouts.length > 0 && (
          <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
            <h2 className="text-sm font-semibold text-success uppercase tracking-wide mb-3">
              What's Going Well
            </h2>
            <ul className="space-y-2">
              {data.goodCallouts.map((callout, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-dashboard-text-primary">
                  <span className="text-success mt-0.5 flex-shrink-0">+</span>
                  {callout}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Wins */}
        {data.quickWins.length > 0 && (
          <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
            <h2 className="text-sm font-semibold text-warning uppercase tracking-wide mb-3">
              Quick Wins
            </h2>
            <ul className="space-y-2">
              {data.quickWins.map((win, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-dashboard-text-primary">
                  <span className="text-warning mt-0.5 flex-shrink-0">*</span>
                  {win}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Issues */}
      {data.issues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-3">
            Issues Detected ({data.issues.length})
          </h2>
          <div className="space-y-3">
            {data.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {/* Channel Summary Table */}
      {data.channels.length > 0 && (
        <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5 overflow-x-auto">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-3">
            Traffic by Channel
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dashboard-text-muted text-left border-b border-dashboard-border">
                <th className="pb-2 pr-4">Channel</th>
                <th className="pb-2 pr-4 text-right">Sessions</th>
                <th className="pb-2 pr-4 text-right">Users</th>
                <th className="pb-2 pr-4 text-right">Conversions</th>
                <th className="pb-2 pr-4 text-right">Share</th>
                <th className="pb-2 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {data.channels.map((ch) => (
                <tr key={ch.channel} className="border-b border-dashboard-border/50 text-dashboard-text-primary">
                  <td className="py-2 pr-4 font-medium">{ch.channel}</td>
                  <td className="py-2 pr-4 text-right">{ch.sessions.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right">{ch.users.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right">{ch.conversions.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right">{(ch.shareOfTraffic * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right">{(ch.engagementRate * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Date Range Info */}
      <p className="text-xs text-dashboard-text-muted text-center">
        Data range: {data.dateRange.start} to {data.dateRange.end}
      </p>
    </div>
  );
}
