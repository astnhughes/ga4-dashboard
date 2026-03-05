import { StoreDashboardData, Issue } from '@shared/types';
import { STORES } from '@shared/constants';
import { KPICard } from '../components/KPICard';
import { IssueCard } from '../components/IssueCard';
import { EducationalPanel } from '../components/EducationalPanel';

interface TechnicalProps {
  data: StoreDashboardData;
}

export function Technical({ data }: TechnicalProps) {
  const accent = STORES[data.storeId].accentColor;

  // Count issues by severity
  const criticalCount = data.issues.filter((i) => i.severity === 'critical').length;
  const highCount = data.issues.filter((i) => i.severity === 'high').length;
  const mediumCount = data.issues.filter((i) => i.severity === 'medium').length;
  const lowCount = data.issues.filter((i) => i.severity === 'low').length;

  // Calculate tracking health
  const unassigned = data.channels.find(
    (ch) => ch.channel.toLowerCase() === 'unassigned' || ch.channel.toLowerCase() === '(not set)'
  );
  const unassignedPct = unassigned ? unassigned.shareOfTraffic : 0;

  const botCities = data.cities.filter((c) => c.flags.includes('bot'));
  const botSessions = botCities.reduce((sum, c) => sum + c.sessions, 0);
  const totalSessions = data.kpis.totalSessions.value;
  const botPct = totalSessions > 0 ? botSessions / totalSessions : 0;

  const phantomEvents = data.events.filter(
    (e) => e.classification === 'lead' && e.uniqueUsers > 0 && e.eventCount / e.uniqueUsers > 5
  );

  // Health status
  const healthStatus = criticalCount > 0 ? 'Critical' : highCount > 0 ? 'Needs Work' : mediumCount > 0 ? 'Fair' : 'Healthy';
  const healthColor = criticalCount > 0 ? '#ef4444' : highCount > 0 ? '#eab308' : mediumCount > 0 ? '#6366f1' : '#22c55e';

  const healthKPI = {
    label: 'Tracking Health',
    value: data.issues.length,
    formattedValue: healthStatus,
  };
  const unassignedKPI = {
    label: 'Unassigned Traffic',
    value: unassignedPct,
    formattedValue: `${(unassignedPct * 100).toFixed(1)}%`,
  };
  const botKPI = {
    label: 'Bot Traffic',
    value: botPct,
    formattedValue: botPct > 0 ? `${(botPct * 100).toFixed(1)}%` : 'Clean',
  };
  const phantomKPI = {
    label: 'Phantom Events',
    value: phantomEvents.length,
    formattedValue: phantomEvents.length > 0 ? `${phantomEvents.length} found` : 'None',
  };

  // Group issues by category
  const categories: Record<string, Issue[]> = {};
  for (const issue of data.issues) {
    if (!categories[issue.category]) categories[issue.category] = [];
    categories[issue.category].push(issue);
  }

  return (
    <div className="space-y-6">
      {/* Health Status Banner */}
      <section
        className="rounded-xl border p-4 flex items-center gap-4"
        style={{ borderColor: healthColor + '44', backgroundColor: healthColor + '08' }}
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: healthColor }}
        />
        <div>
          <p className="text-sm font-semibold text-dashboard-text-primary">
            Tracking Health: {healthStatus}
          </p>
          <p className="text-xs text-dashboard-text-muted">
            {data.issues.length === 0
              ? 'No issues detected. Your tracking setup looks good.'
              : `${data.issues.length} issue${data.issues.length > 1 ? 's' : ''} detected: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low`
            }
          </p>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard kpi={healthKPI} accentColor={accent} />
        <KPICard kpi={unassignedKPI} accentColor={accent} />
        <KPICard kpi={botKPI} accentColor={accent} />
        <KPICard kpi={phantomKPI} accentColor={accent} />
      </section>

      {/* Issues by Category */}
      {Object.entries(categories).map(([category, issues]) => (
        <section key={category}>
          <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-3">
            {category === 'tracking' ? 'Tracking Issues' :
             category === 'bot-traffic' ? 'Bot Traffic' :
             category === 'seo' ? 'SEO Issues' :
             category === 'conversions' ? 'Conversion Issues' :
             category === 'engagement' ? 'Engagement Issues' :
             category}
          </h2>
          <div className="space-y-3">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      ))}

      {/* No Issues State */}
      {data.issues.length === 0 && (
        <section className="bg-dashboard-card rounded-xl border border-success/20 p-8 text-center">
          <p className="text-success text-lg font-semibold mb-2">All Clear</p>
          <p className="text-dashboard-text-muted text-sm">
            No tracking issues detected for {STORES[data.storeId].name}. Keep monitoring regularly to catch issues early.
          </p>
        </section>
      )}

      {/* Educational Content */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide mb-2">
          Technical Fix Guides
        </h2>
        <EducationalPanel title="How to fix unassigned traffic in Google Tag Manager">
          <p><strong>Step 1:</strong> Open Google Tag Manager and go to your GA4 Configuration tag. Verify it's firing on "All Pages" and that the Measurement ID is correct.</p>
          <p><strong>Step 2:</strong> Check your marketing campaigns. Every campaign URL should have UTM parameters: utm_source, utm_medium, utm_campaign. Without these, GA4 can't attribute the traffic to a channel.</p>
          <p><strong>Step 3:</strong> Check your referral exclusion list in GA4. Go to Admin → Data Streams → your stream → Configure tag settings → List unwanted referrals. Add your own domain and any payment processors.</p>
          <p><strong>Step 4:</strong> If you have multiple domains (e.g., a separate service scheduling site), set up cross-domain tracking in GTM to prevent self-referrals.</p>
          <p><strong>Step 5:</strong> Contact your website platform provider (Dealer Inspire, Dealer.com, etc.) and ask them to verify their GA4 integration is passing channel information correctly.</p>
        </EducationalPanel>
        <EducationalPanel title="How to filter bot traffic in GA4">
          <p><strong>Step 1:</strong> In GA4, go to Admin → Data Streams → your web stream → Configure tag settings → Define internal traffic.</p>
          <p><strong>Step 2:</strong> If you know the IP addresses of the bots, add them as internal traffic rules.</p>
          <p><strong>Step 3:</strong> Go to Admin → Data Settings → Data Filters. Create a filter to exclude the internal traffic you defined.</p>
          <p><strong>Step 4:</strong> In Google Tag Manager, consider adding a custom dimension that flags traffic from known bot user agents or suspicious patterns.</p>
          <p><strong>Step 5:</strong> Monitor the flagged cities in this dashboard over the next 30 days. If bot traffic persists from the same sources, consider using Cloudflare or similar services for bot protection at the network level.</p>
        </EducationalPanel>
        <EducationalPanel title="How to debug conversion tracking">
          <p><strong>Step 1:</strong> Open GA4 DebugView (Admin → DebugView). Install the GA4 Debug Chrome extension if you haven't already.</p>
          <p><strong>Step 2:</strong> Go to your website and perform the conversion action (submit a form, click a phone number, etc.). Watch DebugView to see if the event fires.</p>
          <p><strong>Step 3:</strong> If the event doesn't fire, open Google Tag Manager's Preview mode. Navigate to the page and perform the action. Check if the trigger fires and if the tag executes.</p>
          <p><strong>Step 4:</strong> Common issues: trigger conditions too restrictive, wrong variable names, tag paused or deleted, GTM container not published, JavaScript errors preventing tag execution.</p>
          <p><strong>Step 5:</strong> If events fire but aren't marked as conversions in GA4, go to Admin → Conversions and verify the event is toggled on as a conversion event.</p>
        </EducationalPanel>
        <EducationalPanel title="How to fix phantom events">
          <p><strong>Step 1:</strong> Identify which events have an abnormally high count-to-user ratio (shown in the Conversions tab). Any lead event with a ratio above 5x is suspicious.</p>
          <p><strong>Step 2:</strong> Open Google Tag Manager and find the tag for the suspicious event. Check its trigger — is it firing on page load instead of on form submit?</p>
          <p><strong>Step 3:</strong> Look for duplicate tags. Sometimes the same event is tracked by multiple tags (one from GTM, one hardcoded by the website platform).</p>
          <p><strong>Step 4:</strong> Check if third-party chat tools, form providers, or CRM integrations are injecting their own GA4 event tracking that duplicates your existing tags.</p>
          <p><strong>Step 5:</strong> Use GA4 DebugView to watch events in real-time. Submit a form once and count how many events fire. If more than one fires, you have a duplication problem.</p>
        </EducationalPanel>
        <EducationalPanel title="How to improve SEO for your dealership website">
          <p><strong>Step 1:</strong> Claim and optimize your Google Business Profile (GBP). This is the single most impactful thing for local SEO. Ensure your name, address, phone number, hours, and photos are complete and accurate.</p>
          <p><strong>Step 2:</strong> Check your website's page speed using Google PageSpeed Insights. Slow sites rank lower. Target a score above 50 for mobile.</p>
          <p><strong>Step 3:</strong> Ensure every key page has unique title tags and meta descriptions. Don't use the same title on every page — each should describe what's on that specific page.</p>
          <p><strong>Step 4:</strong> Make sure your website is mobile-friendly. Google primarily uses the mobile version of your site for ranking. Use Google's Mobile-Friendly Test tool.</p>
          <p><strong>Step 5:</strong> Create unique content that isn't just manufacturer boilerplate. Pages about your community, your team, and local events help differentiate you from competing dealerships.</p>
        </EducationalPanel>
      </section>
    </div>
  );
}
