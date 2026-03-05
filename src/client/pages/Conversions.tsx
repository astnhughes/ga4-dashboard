import { StoreDashboardData, EventData } from '@shared/types';
import { STORES } from '@shared/constants';
import { KPICard } from '../components/KPICard';
import { IssueCard } from '../components/IssueCard';
import { LineChart } from '../components/charts/LineChart';
import { DoughnutChart } from '../components/charts/DoughnutChart';
import { DataTable } from '../components/DataTable';
import { EducationalPanel } from '../components/EducationalPanel';

interface ConversionsProps {
  data: StoreDashboardData;
}

const CLASSIFICATION_STYLES: Record<string, { bg: string; text: string }> = {
  lead: { bg: 'bg-success/15', text: 'text-success' },
  engagement: { bg: 'bg-infiniti/15', text: 'text-infiniti' },
  system: { bg: 'bg-dashboard-text-muted/15', text: 'text-dashboard-text-muted' },
};

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

export function Conversions({ data }: ConversionsProps) {
  const accent = STORES[data.storeId].accentColor;

  // Filter conversion-related issues
  const conversionIssues = data.issues.filter(
    (i) => i.category === 'tracking' || i.category === 'conversions'
  );

  // Calculate KPIs
  const leadEvents = data.events.filter((e) => e.classification === 'lead');
  const totalLeads = leadEvents.reduce((sum, e) => sum + e.eventCount, 0);
  const _totalLeadUsers = leadEvents.reduce((sum, e) => sum + e.uniqueUsers, 0);

  const vdpEvents = data.events.filter(
    (e) => e.eventName.toLowerCase().includes('vdp') || e.eventName.toLowerCase().includes('vehicle_detail')
  );
  const vdpViews = vdpEvents.reduce((sum, e) => sum + e.eventCount, 0);
  const vdpToLeadRate = vdpViews > 0 ? totalLeads / vdpViews : 0;

  const leadsKPI = {
    label: 'Hard Leads',
    value: totalLeads,
    formattedValue: totalLeads.toLocaleString(),
  };
  const leadsYoY = data.kpis.totalLeads.yoyChange;
  if (leadsYoY !== undefined) {
    (leadsKPI as any).yoyChange = leadsYoY;
  }

  const vdpKPI = {
    label: 'VDP Views',
    value: vdpViews,
    formattedValue: vdpViews >= 1000 ? `${(vdpViews / 1000).toFixed(1)}K` : vdpViews.toLocaleString(),
  };

  const vdpRateKPI = {
    label: 'VDP-to-Lead Rate',
    value: vdpToLeadRate,
    formattedValue: `${(vdpToLeadRate * 100).toFixed(2)}%`,
  };

  const convRateKPI = data.kpis.conversionRate;

  // Macro vs micro breakdown for doughnut
  const macroCount = leadEvents.reduce((sum, e) => sum + e.eventCount, 0);
  const engagementEvents = data.events.filter((e) => e.classification === 'engagement');
  const microCount = engagementEvents.reduce((sum, e) => sum + e.eventCount, 0);

  // Daily conversion trend with tracking break detection
  const dailyLabels = data.dailyConversions.map((d) => formatDate(d.date));
  const dailyValues = data.dailyConversions.map((d) => d.value);

  // Detect tracking breaks for visual highlighting
  const breakDates: Set<number> = new Set();
  for (let i = 1; i < data.dailyConversions.length; i++) {
    const prev = data.dailyConversions[i - 1].value;
    const curr = data.dailyConversions[i].value;
    if (prev > 0 && curr === 0) {
      breakDates.add(i);
    }
    if (prev > 5 && (prev - curr) / prev > 0.4) {
      breakDates.add(i);
    }
  }

  // Events table columns
  const eventColumns = [
    {
      key: 'eventName',
      label: 'Event',
      sortValue: (row: EventData) => row.eventName,
      render: (row: EventData) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{row.eventName}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${CLASSIFICATION_STYLES[row.classification].bg} ${CLASSIFICATION_STYLES[row.classification].text}`}>
            {row.classification}
          </span>
        </div>
      ),
    },
    {
      key: 'eventCount',
      label: 'Count',
      align: 'right' as const,
      sortValue: (row: EventData) => row.eventCount,
      render: (row: EventData) => row.eventCount.toLocaleString(),
    },
    {
      key: 'uniqueUsers',
      label: 'Unique Users',
      align: 'right' as const,
      sortValue: (row: EventData) => row.uniqueUsers,
      render: (row: EventData) => row.uniqueUsers.toLocaleString(),
    },
    {
      key: 'ratio',
      label: 'Events/User',
      align: 'right' as const,
      sortValue: (row: EventData) => row.uniqueUsers > 0 ? row.eventCount / row.uniqueUsers : 0,
      render: (row: EventData) => {
        const ratio = row.uniqueUsers > 0 ? row.eventCount / row.uniqueUsers : 0;
        const isPhantom = ratio > 5 && row.classification === 'lead';
        return (
          <span className={isPhantom ? 'text-danger font-medium' : ''}>
            {ratio.toFixed(1)}x
            {isPhantom && <span className="ml-1 text-xs">(phantom?)</span>}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Needs Attention */}
      {conversionIssues.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-danger uppercase tracking-wide mb-3">
            Needs Attention
          </h2>
          <div className="space-y-3">
            {conversionIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard kpi={leadsKPI} accentColor={accent} />
        <KPICard kpi={vdpKPI} accentColor={accent} />
        <KPICard kpi={vdpRateKPI} accentColor={accent} />
        <KPICard kpi={convRateKPI} accentColor={accent} />
      </section>

      {/* Daily Conversion Trend */}
      <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide">
            Daily Conversions
          </h2>
          {breakDates.size > 0 && (
            <span className="text-xs text-danger font-medium px-2 py-1 bg-danger/10 rounded">
              {breakDates.size} potential tracking break{breakDates.size > 1 ? 's' : ''} detected
            </span>
          )}
        </div>
        <LineChart labels={dailyLabels} data={dailyValues} label="Conversions" color={accent} />
      </section>

      {/* Macro vs Micro Breakdown */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
            Conversion Breakdown
          </h2>
          <DoughnutChart
            labels={['Lead Events (Macro)', 'Engagement Events (Micro)']}
            data={[macroCount, microCount]}
            colors={['#22c55e', '#6366f1']}
            centerLabel="Events"
          />
        </div>

        {/* Lead events summary */}
        <div className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
            Lead Events Summary
          </h2>
          <div className="space-y-2">
            {leadEvents.length > 0 ? (
              leadEvents.slice(0, 8).map((event) => (
                <div key={event.eventName} className="flex items-center justify-between py-1.5 border-b border-dashboard-border/50">
                  <span className="text-sm text-dashboard-text-primary font-mono">{event.eventName}</span>
                  <span className="text-sm text-dashboard-text-primary font-medium">{event.eventCount.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-dashboard-text-muted">No lead events detected in this period.</p>
            )}
            {leadEvents.length > 0 && (
              <div className="flex items-center justify-between pt-2 font-semibold text-sm text-dashboard-text-primary">
                <span>Total Lead Events</span>
                <span>{totalLeads.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Events Table */}
      <section className="bg-dashboard-card rounded-xl border border-dashboard-border p-5">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-4">
          All Events
        </h2>
        <DataTable columns={eventColumns} data={data.events} defaultSortKey="eventCount" />
      </section>

      {/* Educational Content */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-2">
          Learn About Conversions
        </h2>
        <EducationalPanel title="What are Macro vs Micro conversions?">
          <p><strong>Macro conversions</strong> (lead events) are the actions that directly generate a lead for your dealership: form submissions, phone calls, chat initiations, service scheduling, and quote requests. These are your most valuable events because each one represents a potential customer reaching out.</p>
          <p><strong>Micro conversions</strong> (engagement events) are the actions that show a visitor is actively shopping but hasn't contacted you yet: page views, VDP views, SRP views, inventory searches, and video plays. These visitors are in your funnel and may convert later.</p>
          <p><strong>Why both matter:</strong> Macro conversions tell you how many leads you're generating. Micro conversions tell you how healthy your funnel is — if VDP views are high but leads are low, there's a disconnect between browsing and contacting.</p>
        </EducationalPanel>
        <EducationalPanel title="What is a VDP-to-Lead rate?">
          <p>VDP (Vehicle Detail Page) to Lead rate measures what percentage of visitors who view a specific vehicle page go on to submit a lead. It's one of the most important conversion metrics for dealership websites.</p>
          <p>If someone is looking at a specific vehicle, they're showing strong buying intent. If they don't convert, it often means the VDP isn't giving them a compelling reason to take the next step — maybe the CTA buttons aren't prominent, the forms are too long, or the phone number isn't clickable on mobile.</p>
          <p><strong>What good looks like:</strong> 2-5% VDP-to-lead rate. Below 2% suggests your VDPs need optimization. Above 5% is excellent.</p>
        </EducationalPanel>
        <EducationalPanel title="What are phantom events?">
          <p>Phantom events are conversion events that fire far more times than the number of unique users triggering them. For example, if you see 500 "form_submission" events but only 10 unique users, something is wrong with the tracking.</p>
          <p>Common causes include: tags firing on every page load instead of on form submit, duplicate tags in Google Tag Manager, third-party scripts accidentally triggering GA4 events, or automated testing tools hitting your forms.</p>
          <p>Phantom events are dangerous because they inflate your lead counts, making performance look better than it actually is. If you're reporting 500 leads but only 10 are real, decisions based on that data will be wrong.</p>
          <p><strong>How to spot them:</strong> Look at the Events/User ratio in the table above. Any lead event with a ratio above 5x is suspicious and should be investigated.</p>
        </EducationalPanel>
        <EducationalPanel title="What does a conversion tracking break look like?">
          <p>A tracking break happens when conversions suddenly drop to zero or near-zero, not because customers stopped contacting you, but because the tracking code stopped working. This is one of the most critical issues to catch quickly because every day without tracking is lost data you can never recover.</p>
          <p>Common triggers: website platform updates that remove tracking code, Google Tag Manager container changes, GA4 configuration changes, or third-party form providers updating their integration.</p>
          <p><strong>Red flags to watch:</strong> Conversions dropping to zero for 2+ consecutive days, a sudden 40%+ drop day-over-day, or conversions staying flat at an unusually low number. The daily chart above highlights these automatically.</p>
        </EducationalPanel>
        <EducationalPanel title="What is the site-wide conversion rate?">
          <p>Site-wide conversion rate measures what percentage of all website sessions result in at least one conversion (lead) action. It's calculated as: total conversions / total sessions.</p>
          <p>For automotive dealership websites, the industry benchmark is around 1.5-3%. This means out of every 100 visitors, 1.5 to 3 should take a lead action. If your rate is below 1.5%, your website may not be effectively converting browsers into buyers.</p>
          <p><strong>Ways to improve it:</strong> Make phone numbers clickable on mobile, simplify forms (fewer fields = more submissions), add prominent CTAs on every page, ensure chat is working, and optimize your highest-traffic pages first since they have the most impact.</p>
        </EducationalPanel>
      </section>
    </div>
  );
}
