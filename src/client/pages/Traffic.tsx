import { StoreDashboardData, ChannelData } from '@shared/types';
import { STORES } from '@shared/constants';
import { KPICard } from '../components/KPICard';
import { IssueCard } from '../components/IssueCard';
import { LineChart } from '../components/charts/LineChart';
import { DoughnutChart } from '../components/charts/DoughnutChart';
import { DataTable } from '../components/DataTable';
import { EducationalPanel } from '../components/EducationalPanel';

interface TrafficProps {
  data: StoreDashboardData;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#22c55e',
  'Paid Search': '#3b82f6',
  'Direct': '#8b5cf6',
  'Referral': '#f97316',
  'Organic Social': '#ec4899',
  'Paid Social': '#06b6d4',
  'Email': '#eab308',
  'Display': '#14b8a6',
  'Unassigned': '#ef4444',
  '(not set)': '#ef4444',
};

function getChannelColor(channel: string): string {
  return CHANNEL_COLORS[channel] || '#94a3b8';
}

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

export function Traffic({ data }: TrafficProps) {
  const accent = STORES[data.storeId].accentColor;

  // Filter issues relevant to traffic
  const trafficIssues = data.issues.filter(
    (i) => i.category === 'tracking' || i.category === 'bot-traffic' || i.category === 'seo'
  );

  // Build KPIs for traffic
  const totalSessions = data.kpis.totalSessions;
  const totalUsers = data.kpis.totalUsers;

  const newUsersCount = data.channels.reduce((sum, ch) => sum + ch.newUsers, 0);
  const newUsersKPI = {
    label: 'New Users',
    value: newUsersCount,
    formattedValue: newUsersCount >= 1000 ? `${(newUsersCount / 1000).toFixed(1)}K` : newUsersCount.toLocaleString(),
  };

  const sessionsYoY = totalSessions.yoyChange || 0;
  const yoyKPI = {
    label: 'YoY Growth',
    value: sessionsYoY,
    formattedValue: `${sessionsYoY >= 0 ? '+' : ''}${sessionsYoY.toFixed(1)}%`,
  };

  // Chart data
  const dailyLabels = data.dailySessions.map((d) => formatDate(d.date));
  const dailyValues = data.dailySessions.map((d) => d.value);

  // Channel doughnut data
  const channelLabels = data.channels.map((ch) => ch.channel);
  const trafficShares = data.channels.map((ch) => ch.sessions);
  const leadShares = data.channels.map((ch) => ch.conversions);
  const channelColors = data.channels.map((ch) => getChannelColor(ch.channel));

  // Table columns
  const tableColumns = [
    {
      key: 'channel',
      label: 'Channel',
      sortValue: (row: ChannelData) => row.channel,
      render: (row: ChannelData) => (
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: getChannelColor(row.channel) }}
          />
          <span className="font-medium">{row.channel}</span>
        </div>
      ),
    },
    {
      key: 'sessions',
      label: 'Sessions',
      align: 'right' as const,
      sortValue: (row: ChannelData) => row.sessions,
      render: (row: ChannelData) => row.sessions.toLocaleString(),
    },
    {
      key: 'users',
      label: 'Users',
      align: 'right' as const,
      sortValue: (row: ChannelData) => row.users,
      render: (row: ChannelData) => row.users.toLocaleString(),
    },
    {
      key: 'newUsers',
      label: 'New Users',
      align: 'right' as const,
      sortValue: (row: ChannelData) => row.newUsers,
      render: (row: ChannelData) => row.newUsers.toLocaleString(),
    },
    {
      key: 'conversions',
      label: 'Leads',
      align: 'right' as const,
      sortValue: (row: ChannelData) => row.conversions,
      render: (row: ChannelData) => row.conversions.toLocaleString(),
    },
    {
      key: 'shareOfTraffic',
      label: 'Traffic %',
      align: 'right' as const,
      sortValue: (row: ChannelData) => row.shareOfTraffic,
      render: (row: ChannelData) => `${(row.shareOfTraffic * 100).toFixed(1)}%`,
    },
    {
      key: 'engagementRate',
      label: 'Engagement',
      align: 'right' as const,
      sortValue: (row: ChannelData) => row.engagementRate,
      render: (row: ChannelData) => (
        <span className={row.engagementRate < 0.4 ? 'text-danger' : row.engagementRate > 0.6 ? 'text-success' : ''}>
          {(row.engagementRate * 100).toFixed(0)}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Needs Attention */}
      {trafficIssues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-danger uppercase tracking-wide mb-3">
            Needs Attention
          </h2>
          <div className="space-y-3">
            {trafficIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard kpi={totalSessions} accentColor={accent} />
        <KPICard kpi={totalUsers} accentColor={accent} />
        <KPICard kpi={newUsersKPI} accentColor={accent} />
        <KPICard kpi={yoyKPI} accentColor={accent} />
      </section>

      {/* Daily Sessions Trend */}
      <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
          Daily Sessions (90 days)
        </h2>
        <LineChart labels={dailyLabels} data={dailyValues} label="Sessions" color={accent} />
      </section>

      {/* Channel Doughnuts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
            Traffic Share by Channel
          </h2>
          <DoughnutChart labels={channelLabels} data={trafficShares} colors={channelColors} centerLabel="Sessions" />
        </div>
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
            Lead Share by Channel
          </h2>
          <DoughnutChart labels={channelLabels} data={leadShares} colors={channelColors} centerLabel="Leads" />
        </div>
      </section>

      {/* Channel Table */}
      <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
          Channel Breakdown
        </h2>
        <DataTable columns={tableColumns} data={data.channels} defaultSortKey="sessions" />
      </section>

      {/* Educational Content */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-2">
          Learn About Traffic Channels
        </h2>
        <EducationalPanel title="What is Organic Search?">
          <p>Organic Search is traffic from people who found your website by typing something into Google (or Bing) and clicking a non-ad result. For example, someone searching "Toyota dealer near me" and clicking your website listing.</p>
          <p>This is typically the most valuable traffic channel for dealerships because these visitors have high intent — they're actively looking for what you sell. A healthy dealership website should get at least 15-20% of its traffic from organic search.</p>
          <p><strong>What good looks like:</strong> 15-25% of total traffic, engagement rate above 55%, growing year-over-year.</p>
        </EducationalPanel>
        <EducationalPanel title="What is Paid Search?">
          <p>Paid Search (also called SEM or PPC) is traffic from Google Ads or Bing Ads. When someone searches "new Toyota Camry" and clicks on your ad at the top of the results, that's paid search traffic.</p>
          <p>This channel gives you direct control over traffic volume — you can increase or decrease it by adjusting your ad budget. The key metric to watch is whether paid traffic is actually converting into leads, not just visits.</p>
          <p><strong>What good looks like:</strong> Conversion rate at or above site average, cost per lead under your target, engagement rate above 50%.</p>
        </EducationalPanel>
        <EducationalPanel title="What is Direct traffic?">
          <p>Direct traffic means the visitor typed your URL directly into their browser, clicked a bookmark, or came from a source that Google Analytics couldn't identify. This often includes people who already know your dealership.</p>
          <p>A high direct traffic percentage can be a good sign (strong brand awareness) but it can also hide misattributed traffic from other channels. If direct traffic is unusually high, some of it may actually be organic or referral traffic that lost its source information.</p>
          <p><strong>What good looks like:</strong> 15-25% of total traffic with high engagement rate (these visitors know you and are coming back intentionally).</p>
        </EducationalPanel>
        <EducationalPanel title="What is Referral traffic?">
          <p>Referral traffic comes from other websites linking to yours. For dealerships, this commonly includes Cars.com, AutoTrader, KBB, DealerRater, Yelp, and your OEM's website (toyota.com, infiniti.com).</p>
          <p>These are visitors who were browsing another site and clicked a link that brought them to your website. The quality of referral traffic varies widely — OEM referrals tend to be high-quality, while some third-party sites may send lower-quality traffic.</p>
          <p><strong>What good looks like:</strong> Referral sources are recognizable automotive sites, engagement rate is reasonable, and you see conversions from this channel.</p>
        </EducationalPanel>
        <EducationalPanel title="What is Unassigned traffic?">
          <p>Unassigned traffic is a red flag. It means Google Analytics cannot determine how these visitors found your website. This typically happens when tracking is misconfigured — UTM parameters are missing, Google Tag Manager tags aren't set up correctly, or there's a technical issue with your analytics setup.</p>
          <p>When traffic is unassigned, you're flying blind for that portion of your data. You can't tell which marketing efforts are driving those visits, which means you might be wasting budget on channels that aren't working or underinvesting in ones that are.</p>
          <p><strong>What good looks like:</strong> Less than 5% of total traffic. If it's higher, investigate your GTM setup and campaign UTM parameters.</p>
        </EducationalPanel>
      </section>
    </div>
  );
}
