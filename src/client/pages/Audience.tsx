import { StoreDashboardData, CityData } from '@shared/types';
import { STORES } from '@shared/constants';
import { KPICard } from '../components/KPICard';
import { IssueCard } from '../components/IssueCard';
import { BarChart } from '../components/charts/BarChart';
import { DoughnutChart } from '../components/charts/DoughnutChart';
import { DataTable } from '../components/DataTable';
import { EducationalPanel } from '../components/EducationalPanel';

interface AudienceProps {
  data: StoreDashboardData;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Audience({ data }: AudienceProps) {
  const accent = STORES[data.storeId].accentColor;
  const store = STORES[data.storeId];

  // Filter audience/bot issues
  const audienceIssues = data.issues.filter(
    (i) => i.category === 'bot-traffic'
  );

  // KPIs
  const totalCities = data.cities.length;
  const primaryMarketCities = data.cities.filter((c) => c.flags.includes('primary-market'));
  const botCities = data.cities.filter((c) => c.flags.includes('bot'));
  const primaryMarketSessions = primaryMarketCities.reduce((sum, c) => sum + c.sessions, 0);
  const totalSessions = data.kpis.totalSessions.value;
  const primaryMarketShare = totalSessions > 0 ? primaryMarketSessions / totalSessions : 0;
  const botSessions = botCities.reduce((sum, c) => sum + c.sessions, 0);
  const botShare = totalSessions > 0 ? botSessions / totalSessions : 0;

  const citiesKPI = {
    label: 'Unique Cities',
    value: totalCities,
    formattedValue: totalCities.toString(),
  };
  const primaryKPI = {
    label: 'Primary Market Share',
    value: primaryMarketShare,
    formattedValue: `${(primaryMarketShare * 100).toFixed(1)}%`,
  };
  const botKPI = {
    label: 'Suspected Bot Traffic',
    value: botShare,
    formattedValue: botShare > 0 ? `${(botShare * 100).toFixed(1)}%` : 'None detected',
  };
  const usersKPI = data.kpis.totalUsers;

  // Top cities bar chart (horizontal)
  const top15 = data.cities.slice(0, 15);
  const cityLabels = top15.map((c) => c.city);
  const citySessions = top15.map((c) => c.sessions);

  // Device doughnut
  const deviceLabels = data.devices.map((d) => d.device);
  const deviceSessions = data.devices.map((d) => d.sessions);
  const deviceColors = ['#3b82f6', '#22c55e', '#eab308'];

  // City table columns
  const cityColumns = [
    {
      key: 'city',
      label: 'City',
      sortValue: (row: CityData) => row.city,
      render: (row: CityData) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.city}</span>
          {row.flags.includes('primary-market') && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-success/15 text-success">primary</span>
          )}
          {row.flags.includes('bot') && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-danger/15 text-danger">bot?</span>
          )}
          {row.flags.includes('anomaly') && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-warning/15 text-warning">anomaly</span>
          )}
        </div>
      ),
    },
    {
      key: 'region',
      label: 'Region',
      sortValue: (row: CityData) => row.region,
    },
    {
      key: 'sessions',
      label: 'Sessions',
      align: 'right' as const,
      sortValue: (row: CityData) => row.sessions,
      render: (row: CityData) => row.sessions.toLocaleString(),
    },
    {
      key: 'users',
      label: 'Users',
      align: 'right' as const,
      sortValue: (row: CityData) => row.users,
      render: (row: CityData) => row.users.toLocaleString(),
    },
    {
      key: 'engagementRate',
      label: 'Engagement',
      align: 'right' as const,
      sortValue: (row: CityData) => row.engagementRate,
      render: (row: CityData) => (
        <span className={row.engagementRate < 0.3 ? 'text-danger' : row.engagementRate > 0.6 ? 'text-success' : ''}>
          {(row.engagementRate * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'avgSessionDuration',
      label: 'Avg Duration',
      align: 'right' as const,
      sortValue: (row: CityData) => row.avgSessionDuration,
      render: (row: CityData) => formatDuration(row.avgSessionDuration),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Needs Attention */}
      {audienceIssues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-danger uppercase tracking-wide mb-3">
            Needs Attention
          </h2>
          <div className="space-y-3">
            {audienceIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard kpi={usersKPI} accentColor={accent} />
        <KPICard kpi={citiesKPI} accentColor={accent} />
        <KPICard kpi={primaryKPI} accentColor={accent} />
        <KPICard kpi={botKPI} accentColor={accent} />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Cities Bar Chart */}
        <div className="lg:col-span-2 bg-dashboard-card rounded-xl border border-dashboard-border p-5">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
            Top 15 Cities by Sessions
          </h2>
          <BarChart
            labels={cityLabels}
            datasets={[{ label: 'Sessions', data: citySessions, color: accent }]}
            horizontal
            height={400}
          />
        </div>

        {/* Device Split */}
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
            Device Split
          </h2>
          <DoughnutChart
            labels={deviceLabels}
            data={deviceSessions}
            colors={deviceColors}
            centerLabel="Devices"
          />
        </div>
      </section>

      {/* Primary Market Summary */}
      {primaryMarketCities.length > 0 && (
        <section className="bg-dashboard-card rounded-xl border border-success/20 p-5">
          <h2 className="text-sm font-semibold text-success uppercase tracking-wide mb-3">
            Primary Market: {store.primaryMarket}
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-dashboard-text-primary">{primaryMarketSessions.toLocaleString()}</p>
              <p className="text-xs text-dashboard-text-muted">Sessions from DMA</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-dashboard-text-primary">{(primaryMarketShare * 100).toFixed(1)}%</p>
              <p className="text-xs text-dashboard-text-muted">of Total Traffic</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-dashboard-text-primary">{primaryMarketCities.length}</p>
              <p className="text-xs text-dashboard-text-muted">Cities in Market</p>
            </div>
          </div>
        </section>
      )}

      {/* Cities Table */}
      <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
          All Cities
        </h2>
        <DataTable columns={cityColumns} data={data.cities} defaultSortKey="sessions" />
      </section>

      {/* Educational Content */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-2">
          Learn About Your Audience
        </h2>
        <EducationalPanel title="What is a Primary Market (DMA)?">
          <p>Your primary market or DMA (Designated Market Area) is the geographic area where most of your customers live. For {store.name}, this is the {store.primaryMarket} area and surrounding communities.</p>
          <p>Ideally, 30-50% of your website traffic should come from your primary market. If it's lower, your marketing may be reaching people too far away to realistically visit your dealership. If it's much higher, you might have room to expand your digital advertising reach.</p>
          <p><strong>What good looks like:</strong> 30-50% of traffic from your DMA, with engagement rates from local visitors higher than the site average.</p>
        </EducationalPanel>
        <EducationalPanel title="How to spot bot traffic">
          <p>Bot traffic comes from automated programs, not real humans. Common signs include: very low engagement rates (under 10%), sessions from cities known for data centers (Ashburn VA, Boardman OR, Council Bluffs IA), and unnaturally consistent patterns.</p>
          <p>Bot traffic is problematic because it inflates your session counts and drags down your engagement metrics. If 10% of your sessions are bots with 0% engagement, your true engagement rate is higher than what GA4 reports.</p>
          <p><strong>Cities to watch:</strong> Ashburn (Amazon AWS), Boardman (Google Cloud), Council Bluffs (Google/Facebook), and Lanzhou (known bot source). These cities are flagged automatically in the table above.</p>
        </EducationalPanel>
        <EducationalPanel title="Why does device split matter for dealerships?">
          <p>Understanding how your audience accesses your website is crucial for optimization. Most dealership websites see 60-70% mobile traffic, 25-35% desktop, and 3-8% tablet.</p>
          <p>If your mobile traffic is below 60%, your digital advertising might be skewing toward desktop users (which is unusual for car shoppers). If mobile is above 75%, make sure your mobile experience is excellent since that's where the vast majority of your shoppers are.</p>
          <p><strong>Action item:</strong> Compare engagement rates by device. If mobile engagement is significantly lower than desktop, that's your biggest optimization opportunity.</p>
        </EducationalPanel>
      </section>
    </div>
  );
}
