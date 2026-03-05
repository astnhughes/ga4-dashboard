import { EducationalPanel } from '../components/EducationalPanel';

export function Guide() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-dashboard-text-primary mb-2">Dashboard User Guide</h1>
        <p className="text-sm text-dashboard-text-muted">
          This dashboard analyzes Google Analytics 4 data for Principle Auto Group dealerships. It runs automated checks against industry benchmarks and highlights what needs attention.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide">Getting Started</h2>
        <EducationalPanel title="How to switch between stores" defaultOpen>
          <p>Use the store buttons in the header (e.g., "Toyota of Hernando", "INFINITI of Boerne"). All data, charts, and issues update instantly when you switch stores. Each store has its own accent color for visual distinction.</p>
        </EducationalPanel>
        <EducationalPanel title="How to refresh data">
          <p>Click the <strong>Refresh</strong> button in the top-right corner. This clears the server cache and pulls fresh data from the GA4 API. Data is cached for 15 minutes to avoid hitting API limits — the header shows when data was last updated.</p>
        </EducationalPanel>
        <EducationalPanel title="What does the date range mean?">
          <p>The dashboard shows a rolling 90-day window. The date range in the header (e.g., "Dec 5, 2025 – Mar 4, 2026") shows the exact period being analyzed. This range updates automatically each day.</p>
        </EducationalPanel>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide">Understanding the Tabs</h2>
        <EducationalPanel title="Overview">
          <p>Your executive summary. Shows 4 key metrics (sessions, users, leads, conversion rate), positive callouts (what's going well), quick wins (easy improvements), and a list of all detected issues. Start here to get the big picture.</p>
        </EducationalPanel>
        <EducationalPanel title="Traffic">
          <p>Where your website visitors come from. Shows traffic by channel (Organic, Paid, Direct, Referral, etc.), a 90-day session trend, and which channels generate the most leads. The educational panels explain what each channel means for your dealership.</p>
        </EducationalPanel>
        <EducationalPanel title="Engagement">
          <p>How visitors behave on your site. Shows engagement rate, bounce rate, session duration, and pages per session — broken down by device (mobile, desktop, tablet). Also shows your top 10 most-visited pages.</p>
        </EducationalPanel>
        <EducationalPanel title="Conversions">
          <p>Your lead generation performance. Shows hard leads, VDP views, VDP-to-lead rate, and conversion rate. The daily chart highlights potential tracking breaks. The events table shows all tracked events with phantom event detection (events that fire too many times per user).</p>
        </EducationalPanel>
        <EducationalPanel title="Audience">
          <p>Who visits your site and where they're from. Shows a map of your top 15 cities, device split, and primary market analysis. Cities are flagged if they're in your market area, suspected bot traffic, or anomalous. The table lets you sort and explore all city data.</p>
        </EducationalPanel>
        <EducationalPanel title="Technical">
          <p>Your tracking health report. Aggregates all issues detected by the analysis engine, grouped by category (tracking, bot traffic, SEO, conversions, engagement). The health banner at the top gives you a quick status: Critical, Needs Work, Fair, or Healthy. Step-by-step fix guides are at the bottom.</p>
        </EducationalPanel>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide">Reading the Data</h2>
        <EducationalPanel title="What do the severity levels mean?">
          <p><strong>Critical</strong> (red): Something is broken and needs immediate attention — like conversion tracking not working or extremely high unassigned traffic. These directly impact your ability to measure performance.</p>
          <p><strong>High</strong> (yellow): Significant issue that should be addressed soon — like bot traffic inflating numbers or phantom events giving false lead counts.</p>
          <p><strong>Medium</strong> (indigo): Worth investigating when you have time — like low organic search share or low mobile engagement.</p>
          <p><strong>Low</strong> (gray): Minor observation — like slightly high bounce rates on some channels.</p>
        </EducationalPanel>
        <EducationalPanel title="What does YoY change mean?">
          <p>Year-over-Year change compares the current 90-day period to the same 90-day period last year. A green +15% means that metric is 15% higher than last year. A red -10% means it dropped. This helps you understand trends beyond seasonal variation.</p>
        </EducationalPanel>
        <EducationalPanel title="How are benchmarks determined?">
          <p>The dashboard uses automotive industry benchmarks from GA4 data across dealership websites. Key benchmarks: organic traffic should be 30-50% of total, engagement rate 55-65%, conversion rate 1.5-3%, and mobile engagement within 10-15% of desktop. These are guidelines — your specific market may vary.</p>
        </EducationalPanel>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-dashboard-text-muted uppercase tracking-wide">Taking Action</h2>
        <EducationalPanel title="What should I do first?">
          <p><strong>1.</strong> Check the Overview tab for any Critical issues — fix these immediately.</p>
          <p><strong>2.</strong> Review Quick Wins — these are easy improvements with high impact.</p>
          <p><strong>3.</strong> Go to the Technical tab and follow the fix guides for any detected issues.</p>
          <p><strong>4.</strong> Check Conversions for tracking breaks — if your conversion tracking is broken, you can't measure anything else accurately.</p>
          <p><strong>5.</strong> Review Traffic and Audience for unusual patterns (bot traffic, unassigned channels, unexpected geographic trends).</p>
        </EducationalPanel>
        <EducationalPanel title="Who should fix what?">
          <p><strong>Marketing team:</strong> UTM parameters, campaign tracking, Google Business Profile optimization</p>
          <p><strong>Website provider (DI, Dealer.com, etc.):</strong> GA4 tag implementation, conversion tracking, page speed, mobile optimization</p>
          <p><strong>Google Tag Manager admin:</strong> Tag configuration, trigger setup, event naming, cross-domain tracking</p>
          <p><strong>GA4 admin:</strong> Property settings, data filters, conversion events, referral exclusions</p>
        </EducationalPanel>
      </section>
    </div>
  );
}
