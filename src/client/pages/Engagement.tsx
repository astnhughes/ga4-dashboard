import { StoreDashboardData, DeviceData, PageData } from '@shared/types';
import { STORES } from '@shared/constants';
import { KPICard } from '../components/KPICard';
import { IssueCard } from '../components/IssueCard';
import { BarChart } from '../components/charts/BarChart';
import { DataTable } from '../components/DataTable';
import { EducationalPanel } from '../components/EducationalPanel';

interface EngagementProps {
  data: StoreDashboardData;
}

export function Engagement({ data }: EngagementProps) {
  const accent = STORES[data.storeId].accentColor;

  // Filter engagement issues
  const engagementIssues = data.issues.filter((i) => i.category === 'engagement');

  // Calculate engagement KPIs from device data
  const totalSessions = data.devices.reduce((sum, d) => sum + d.sessions, 0);
  const weightedEngagement = data.devices.reduce((sum, d) => sum + d.engagementRate * d.sessions, 0);
  const weightedBounce = data.devices.reduce((sum, d) => sum + d.bounceRate * d.sessions, 0);
  const weightedDuration = data.devices.reduce((sum, d) => sum + d.avgSessionDuration * d.sessions, 0);
  const weightedPages = data.devices.reduce((sum, d) => sum + d.pagesPerSession * d.sessions, 0);

  const avgEngagement = totalSessions > 0 ? weightedEngagement / totalSessions : 0;
  const avgBounce = totalSessions > 0 ? weightedBounce / totalSessions : 0;
  const avgDuration = totalSessions > 0 ? weightedDuration / totalSessions : 0;
  const avgPages = totalSessions > 0 ? weightedPages / totalSessions : 0;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const engagementKPI = {
    label: 'Engagement Rate',
    value: avgEngagement,
    formattedValue: `${(avgEngagement * 100).toFixed(1)}%`,
  };
  const bounceKPI = {
    label: 'Bounce Rate',
    value: avgBounce,
    formattedValue: `${(avgBounce * 100).toFixed(1)}%`,
  };
  const durationKPI = {
    label: 'Avg Session Duration',
    value: avgDuration,
    formattedValue: formatDuration(avgDuration),
  };
  const pagesKPI = {
    label: 'Pages / Session',
    value: avgPages,
    formattedValue: avgPages.toFixed(1),
  };

  // Device bar chart data
  const deviceLabels = data.devices.map((d) => d.device);
  const deviceDatasets = [
    { label: 'Engagement Rate', data: data.devices.map((d) => d.engagementRate * 100), color: '#22c55e' },
    { label: 'Bounce Rate', data: data.devices.map((d) => d.bounceRate * 100), color: '#ef4444' },
  ];

  // Top pages table columns
  const pageColumns = [
    {
      key: 'pagePath',
      label: 'Page',
      sortValue: (row: PageData) => row.pagePath,
      render: (row: PageData) => (
        <span className="font-mono text-xs" title={row.pagePath}>
          {row.pagePath.length > 40 ? row.pagePath.slice(0, 40) + '...' : row.pagePath}
        </span>
      ),
    },
    {
      key: 'sessions',
      label: 'Sessions',
      align: 'right' as const,
      sortValue: (row: PageData) => row.sessions,
      render: (row: PageData) => row.sessions.toLocaleString(),
    },
    {
      key: 'engagementRate',
      label: 'Engagement',
      align: 'right' as const,
      sortValue: (row: PageData) => row.engagementRate,
      render: (row: PageData) => (
        <span className={row.engagementRate < 0.4 ? 'text-danger' : row.engagementRate > 0.6 ? 'text-success' : ''}>
          {(row.engagementRate * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'bounceRate',
      label: 'Bounce',
      align: 'right' as const,
      sortValue: (row: PageData) => row.bounceRate,
      render: (row: PageData) => (
        <span className={row.bounceRate > 0.5 ? 'text-danger' : row.bounceRate < 0.3 ? 'text-success' : ''}>
          {(row.bounceRate * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'avgSessionDuration',
      label: 'Avg Duration',
      align: 'right' as const,
      sortValue: (row: PageData) => row.avgSessionDuration,
      render: (row: PageData) => formatDuration(row.avgSessionDuration),
    },
  ];

  // Device table columns
  const deviceColumns = [
    {
      key: 'device',
      label: 'Device',
      sortValue: (row: DeviceData) => row.device,
      render: (row: DeviceData) => <span className="capitalize font-medium">{row.device}</span>,
    },
    {
      key: 'sessions',
      label: 'Sessions',
      align: 'right' as const,
      sortValue: (row: DeviceData) => row.sessions,
      render: (row: DeviceData) => (
        <span>
          {row.sessions.toLocaleString()}
          <span className="text-dashboard-text-muted ml-1">
            ({totalSessions > 0 ? ((row.sessions / totalSessions) * 100).toFixed(0) : 0}%)
          </span>
        </span>
      ),
    },
    {
      key: 'engagementRate',
      label: 'Engagement',
      align: 'right' as const,
      sortValue: (row: DeviceData) => row.engagementRate,
      render: (row: DeviceData) => (
        <span className={row.engagementRate < 0.4 ? 'text-danger' : row.engagementRate > 0.6 ? 'text-success' : ''}>
          {(row.engagementRate * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'bounceRate',
      label: 'Bounce',
      align: 'right' as const,
      sortValue: (row: DeviceData) => row.bounceRate,
      render: (row: DeviceData) => (
        <span className={row.bounceRate > 0.5 ? 'text-danger' : row.bounceRate < 0.3 ? 'text-success' : ''}>
          {(row.bounceRate * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'avgSessionDuration',
      label: 'Avg Duration',
      align: 'right' as const,
      sortValue: (row: DeviceData) => row.avgSessionDuration,
      render: (row: DeviceData) => formatDuration(row.avgSessionDuration),
    },
    {
      key: 'pagesPerSession',
      label: 'Pages/Session',
      align: 'right' as const,
      sortValue: (row: DeviceData) => row.pagesPerSession,
      render: (row: DeviceData) => row.pagesPerSession.toFixed(1),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Needs Attention */}
      {engagementIssues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-danger uppercase tracking-wide mb-3">
            Needs Attention
          </h2>
          <div className="space-y-3">
            {engagementIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard kpi={engagementKPI} accentColor={accent} />
        <KPICard kpi={bounceKPI} accentColor={accent} />
        <KPICard kpi={durationKPI} accentColor={accent} />
        <KPICard kpi={pagesKPI} accentColor={accent} />
      </section>

      {/* Device Performance Chart */}
      <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
          Engagement vs Bounce Rate by Device
        </h2>
        <BarChart
          labels={deviceLabels}
          datasets={deviceDatasets}
          height={250}
          formatValue={(v) => `${Number(v).toFixed(0)}%`}
        />
      </section>

      {/* Device Table */}
      <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
          Device Breakdown
        </h2>
        <DataTable columns={deviceColumns} data={data.devices} defaultSortKey="sessions" />
      </section>

      {/* Top Pages Table */}
      {data.topPages.length > 0 && (
        <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
            Top 10 Pages
          </h2>
          <DataTable columns={pageColumns} data={data.topPages} defaultSortKey="sessions" />
        </section>
      )}

      {/* Educational Content */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-2">
          Learn About Engagement Metrics
        </h2>
        <EducationalPanel title="What is Engagement Rate?">
          <p>Engagement rate is the percentage of sessions where a visitor actually interacted with your website in a meaningful way. GA4 considers a session "engaged" if the visitor did at least one of these things: stayed on the site for more than 10 seconds, viewed 2 or more pages, or triggered a conversion event (like submitting a form).</p>
          <p>This is one of the most important metrics because it tells you whether visitors are actually interested in your content or just bouncing off. For auto dealerships, a healthy engagement rate is typically 55-70%.</p>
          <p><strong>What good looks like:</strong> Above 55% overall. Mobile engagement is usually lower than desktop — if the gap is large, your mobile experience needs work.</p>
        </EducationalPanel>
        <EducationalPanel title="What is Bounce Rate?">
          <p>Bounce rate is the opposite of engagement rate — it's the percentage of visitors who left your site after viewing only one page, spending less than 10 seconds, and not triggering any conversion. In simple terms, they "bounced" away.</p>
          <p>A high bounce rate on your homepage or vehicle listing pages is a problem because it means visitors aren't finding what they're looking for. However, a high bounce rate on a contact page might be normal if visitors just needed your phone number.</p>
          <p><strong>What good looks like:</strong> Below 40% for the overall site. Individual pages like VDPs (Vehicle Detail Pages) should ideally be below 35%.</p>
        </EducationalPanel>
        <EducationalPanel title="What is Avg Session Duration?">
          <p>Average session duration measures how long visitors spend on your website per visit, in minutes and seconds. Longer sessions generally indicate that visitors are engaged with your content — browsing inventory, reading about services, or comparing vehicles.</p>
          <p>For dealership websites, the ideal session length depends on the page type. Someone browsing your inventory should spend 3-5 minutes. Someone on a service scheduling page might be quicker at 1-2 minutes. Very short sessions (under 30 seconds) often indicate a problem with the landing page.</p>
          <p><strong>What good looks like:</strong> 2-4 minutes overall. Desktop sessions are typically longer than mobile.</p>
        </EducationalPanel>
        <EducationalPanel title="What is Pages Per Session?">
          <p>Pages per session counts how many pages a visitor views during a single visit. More pages usually means the visitor is exploring your site — looking at multiple vehicles, checking service options, or reading about your dealership.</p>
          <p>For automotive websites, a typical browsing journey might be: homepage → inventory search → VDP → contact form. That's 4 pages. If your pages per session is below 2, visitors might not be finding what they want or your site navigation might be confusing.</p>
          <p><strong>What good looks like:</strong> 2.5-4 pages per session. If it's below 2, consider improving internal linking and navigation.</p>
        </EducationalPanel>
        <EducationalPanel title="Why does mobile performance matter?">
          <p>For most dealerships, 60-70% of website traffic comes from mobile devices. If your mobile bounce rate is significantly higher than desktop, or mobile engagement is much lower, you're losing the majority of your potential customers.</p>
          <p>Common mobile issues include: slow page load times, buttons too small to tap, forms that are hard to fill out on a phone, and content that requires zooming to read. Fixing mobile experience is often the single highest-impact thing a dealership can do.</p>
          <p><strong>What to look for:</strong> Compare mobile vs desktop engagement rate. If mobile is more than 15 percentage points lower, mobile optimization should be a priority.</p>
        </EducationalPanel>
      </section>
    </div>
  );
}
