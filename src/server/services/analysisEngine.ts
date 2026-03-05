import { BENCHMARKS } from '../../shared/constants';
import { StoreDashboardData, Issue, Severity } from '../../shared/types';

let issueIdCounter = 0;

function createIssue(
  title: string,
  severity: Severity,
  category: string,
  whatThisMeans: string,
  howToFix: string,
  metric?: string,
  value?: number,
  benchmark?: number
): Issue {
  issueIdCounter++;
  return {
    id: `issue-${issueIdCounter}`,
    title,
    severity,
    category,
    whatThisMeans,
    howToFix,
    metric,
    value,
    benchmark,
  };
}

function checkUnassignedTraffic(data: StoreDashboardData): Issue | null {
  const unassigned = data.channels.find(
    (ch) => ch.channel.toLowerCase() === 'unassigned' || ch.channel.toLowerCase() === '(not set)'
  );
  if (!unassigned) return null;

  const share = unassigned.shareOfTraffic;
  if (share > BENCHMARKS.unassignedTrafficCritical) {
    return createIssue(
      `Unassigned traffic is ${(share * 100).toFixed(1)}% of total sessions`,
      'critical',
      'tracking',
      'Unassigned traffic means Google Analytics cannot determine how visitors found your website. This usually indicates a tracking configuration problem in Google Tag Manager (GTM) or your website platform. When traffic is unassigned, you cannot make informed decisions about which marketing channels are working because a significant portion of your data is essentially hidden.',
      '1. Open Google Tag Manager for this property\n2. Check that all tags have proper campaign parameters (UTM tags)\n3. Verify that the GA4 configuration tag is firing correctly on all pages\n4. Check for self-referrals in your referral exclusion list\n5. Ensure cross-domain tracking is configured if you have multiple domains\n6. Contact your website platform (Dealer Inspire or Dealer.com) to verify their GA4 integration',
      'Unassigned Traffic Share',
      share,
      BENCHMARKS.unassignedTrafficCritical
    );
  } else if (share > BENCHMARKS.unassignedTrafficHigh) {
    return createIssue(
      `Unassigned traffic is ${(share * 100).toFixed(1)}% of total sessions`,
      'high',
      'tracking',
      'A moderate amount of your traffic cannot be attributed to a specific marketing channel. While some unassigned traffic is normal (typically under 5%), this level suggests there may be tracking gaps worth investigating.',
      '1. Review your Google Tag Manager configuration\n2. Check UTM parameters on your marketing campaigns\n3. Verify GA4 configuration tag is firing on all pages',
      'Unassigned Traffic Share',
      share,
      BENCHMARKS.unassignedTrafficHigh
    );
  }
  return null;
}

function checkBotTraffic(data: StoreDashboardData): Issue | null {
  const suspectCities = data.cities.filter((city) => {
    const isLowEngagement = city.engagementRate < BENCHMARKS.botEngagementThreshold;
    const isSignificant = city.sessions > 10;
    // Check for known bot traffic cities or unexpected foreign locations
    const suspectNames = ['lanzhou', 'ashburn', 'boardman', 'council bluffs'];
    const isSuspectCity = suspectNames.some((name) =>
      city.city.toLowerCase().includes(name)
    );
    return isLowEngagement && isSignificant && isSuspectCity;
  });

  if (suspectCities.length > 0) {
    const cityNames = suspectCities.map((c) => c.city).join(', ');
    const totalBotSessions = suspectCities.reduce((sum, c) => sum + c.sessions, 0);
    const totalSessions = data.kpis.totalSessions.value;
    const botPercentage = totalSessions > 0 ? (totalBotSessions / totalSessions) * 100 : 0;

    // Flag these cities
    suspectCities.forEach((city) => {
      const dataCity = data.cities.find(
        (c) => c.city === city.city && c.region === city.region
      );
      if (dataCity && !dataCity.flags.includes('bot')) {
        dataCity.flags.push('bot');
      }
    });

    return createIssue(
      `Suspected bot traffic detected from ${cityNames}`,
      'high',
      'bot-traffic',
      `Traffic from ${cityNames} shows very low engagement rates (under ${(BENCHMARKS.botEngagementThreshold * 100)}%), which is a strong indicator of bot or spam traffic. This accounts for approximately ${botPercentage.toFixed(1)}% of your total sessions. Bot traffic inflates your session counts and deflates your engagement metrics, making your real performance look worse than it actually is.`,
      '1. In GA4, go to Admin → Data Streams → your stream → Configure tag settings\n2. Enable "Define internal traffic" and add the IP ranges for known bots\n3. Create a data filter to exclude bot traffic\n4. Consider adding bot filtering in Google Tag Manager\n5. Monitor these cities over the next 30 days to see if the pattern continues',
      'Bot Traffic Percentage',
      botPercentage,
      0
    );
  }
  return null;
}

function checkConversionTrackingBreak(data: StoreDashboardData): Issue | null {
  const daily = data.dailyConversions;
  if (daily.length < 2) return null;

  for (let i = 1; i < daily.length; i++) {
    const prev = daily[i - 1].value;
    const curr = daily[i].value;
    if (prev > 0 && curr === 0) {
      return createIssue(
        `Conversion tracking may have broken on ${daily[i].date}`,
        'critical',
        'tracking',
        'Daily conversions dropped to zero, which usually means conversion tracking stopped working rather than an actual drop in leads. This is critical because every day without tracking means lost data about your leads and customer actions. Common causes include a website update that removed tracking code, a GTM container change, or a GA4 configuration issue.',
        '1. Check if the website had any updates or changes on this date\n2. Verify GA4 conversion events are still firing (use GA4 DebugView)\n3. Check Google Tag Manager for any recent container changes\n4. Test form submissions and phone clicks to see if events fire\n5. Contact your website platform to verify tracking code is intact',
        'Conversions',
        curr,
        prev
      );
    }
    if (prev > 5 && (prev - curr) / prev > BENCHMARKS.conversionDropThreshold) {
      return createIssue(
        `Conversions dropped ${(((prev - curr) / prev) * 100).toFixed(0)}% on ${daily[i].date}`,
        'critical',
        'tracking',
        `Conversions dropped by more than ${(BENCHMARKS.conversionDropThreshold * 100)}% day-over-day. While some daily variation is normal, a drop this large often indicates a tracking issue rather than an actual change in customer behavior.`,
        '1. Check GA4 DebugView to verify events are still firing\n2. Review Google Tag Manager for recent changes\n3. Test conversion actions (forms, phone clicks) on the website\n4. Compare with previous weeks to see if this is a pattern',
        'Day-over-Day Drop',
        (prev - curr) / prev,
        BENCHMARKS.conversionDropThreshold
      );
    }
  }
  return null;
}

function checkLowOrganicSearch(data: StoreDashboardData): Issue | null {
  const organic = data.channels.find(
    (ch) => ch.channel.toLowerCase() === 'organic search'
  );
  if (!organic) return null;

  if (organic.shareOfTraffic < BENCHMARKS.organicSearchMinShare) {
    return createIssue(
      `Organic search is only ${(organic.shareOfTraffic * 100).toFixed(1)}% of traffic`,
      'medium',
      'seo',
      `Organic search traffic should typically account for at least ${(BENCHMARKS.organicSearchMinShare * 100)}% of a dealership's total traffic. A low organic share means your website isn't ranking well in Google search results for relevant terms like "${data.storeName.includes('Toyota') ? 'Toyota dealer near me' : 'INFINITI dealer near me'}". This makes you more dependent on paid advertising for traffic.`,
      '1. Run a site audit to check for SEO issues (page speed, mobile-friendliness, broken links)\n2. Ensure your Google Business Profile is complete and optimized\n3. Check that key pages have proper title tags and meta descriptions\n4. Verify your website has unique content (not just manufacturer boilerplate)\n5. Consider investing in local SEO for your market area',
      'Organic Search Share',
      organic.shareOfTraffic,
      BENCHMARKS.organicSearchMinShare
    );
  }
  return null;
}

function checkLowConversionRate(data: StoreDashboardData): Issue | null {
  const rate = data.kpis.conversionRate.value;
  if (rate < BENCHMARKS.siteConversionRate) {
    return createIssue(
      `Site-wide conversion rate is ${(rate * 100).toFixed(2)}%`,
      'medium',
      'conversions',
      `Your website is converting visitors into leads at a rate below the automotive industry benchmark of ${(BENCHMARKS.siteConversionRate * 100)}%. This means out of every 100 visitors, fewer than ${(BENCHMARKS.siteConversionRate * 100).toFixed(1)} are taking a lead action (submitting a form, calling, chatting, etc.). Improving this rate is one of the highest-impact things you can do.`,
      '1. Ensure CTAs (Call-to-Action buttons) are prominent on every page\n2. Make phone numbers clickable on mobile\n3. Simplify form fields (fewer fields = more submissions)\n4. Add chat functionality if not already present\n5. Optimize VDP (Vehicle Detail Pages) with clear next-step actions\n6. Check that forms are working correctly across all devices',
      'Conversion Rate',
      rate,
      BENCHMARKS.siteConversionRate
    );
  }
  return null;
}

function checkHighBounceRate(data: StoreDashboardData): Issue | null {
  const totalSessions = data.devices.reduce((sum, d) => sum + d.sessions, 0);
  const weightedBounce = data.devices.reduce(
    (sum, d) => sum + d.bounceRate * d.sessions,
    0
  );
  const avgBounceRate = totalSessions > 0 ? weightedBounce / totalSessions : 0;

  if (avgBounceRate > BENCHMARKS.bounceRateMax) {
    return createIssue(
      `Bounce rate is ${(avgBounceRate * 100).toFixed(1)}%`,
      'medium',
      'engagement',
      `More than ${(BENCHMARKS.bounceRateMax * 100)}% of visitors are leaving your website after viewing only one page. In the automotive industry, a bounce rate above ${(BENCHMARKS.bounceRateMax * 100)}% suggests visitors aren't finding what they're looking for, or the landing page experience needs improvement.`,
      '1. Check page load speed (slow pages cause bounces)\n2. Ensure landing pages match the ads or search queries driving traffic\n3. Improve above-the-fold content to engage visitors immediately\n4. Add internal links and suggested vehicles to keep visitors browsing\n5. Check mobile experience — high mobile bounce rate is the most common issue',
      'Bounce Rate',
      avgBounceRate,
      BENCHMARKS.bounceRateMax
    );
  }
  return null;
}

function checkPhantomEvents(data: StoreDashboardData): Issue | null {
  const phantomEvents = data.events.filter((event) => {
    if (event.uniqueUsers === 0) return false;
    const ratio = event.eventCount / event.uniqueUsers;
    return ratio > BENCHMARKS.phantomEventRatio && event.classification === 'lead';
  });

  if (phantomEvents.length > 0) {
    const names = phantomEvents.map((e) => e.eventName).join(', ');
    return createIssue(
      `Possible phantom events detected: ${names}`,
      'high',
      'tracking',
      `Some conversion events are firing far more times than the number of unique users triggering them (ratio > ${BENCHMARKS.phantomEventRatio}x). This usually means the tracking is misconfigured and counting duplicate or automated events. This inflates your lead counts and gives a false picture of performance.`,
      '1. Check Google Tag Manager for duplicate tags or triggers\n2. Verify form submission events only fire once per actual submission\n3. Look for events that fire on page load instead of on user action\n4. Check if third-party scripts are triggering GA4 events\n5. Use GA4 DebugView to watch events fire in real-time',
      'Phantom Events',
      phantomEvents.length,
      0
    );
  }
  return null;
}

function checkLowEngagementRate(data: StoreDashboardData): Issue | null {
  const totalSessions = data.devices.reduce((sum, d) => sum + d.sessions, 0);
  const weightedEngagement = data.devices.reduce(
    (sum, d) => sum + d.engagementRate * d.sessions,
    0
  );
  const avgEngagement = totalSessions > 0 ? weightedEngagement / totalSessions : 0;

  if (avgEngagement < BENCHMARKS.engagementRateMin) {
    return createIssue(
      `Engagement rate is ${(avgEngagement * 100).toFixed(1)}%`,
      'low',
      'engagement',
      `Your site-wide engagement rate is below the ${(BENCHMARKS.engagementRateMin * 100)}% benchmark. Engagement rate measures the percentage of sessions where a visitor interacted meaningfully with your site (stayed more than 10 seconds, viewed 2+ pages, or triggered a conversion). A low rate suggests visitors aren't finding your content compelling.`,
      '1. Improve page content quality and relevance\n2. Add engaging elements (photos, videos, virtual tours)\n3. Ensure fast page load times\n4. Make navigation intuitive and easy to use\n5. Consider the user journey — is it easy to find vehicles and take action?',
      'Engagement Rate',
      avgEngagement,
      BENCHMARKS.engagementRateMin
    );
  }
  return null;
}

// --- Callout generators ---

function generateGoodCallouts(data: StoreDashboardData): string[] {
  const callouts: string[] = [];

  // Check for strong YoY growth
  const sessionsYoY = data.kpis.totalSessions.yoyChange || 0;
  if (sessionsYoY > 10) {
    callouts.push(`Traffic is up ${sessionsYoY.toFixed(0)}% year-over-year — strong growth trend`);
  }

  // Check for good engagement
  const topChannel = data.channels[0];
  if (topChannel && topChannel.engagementRate > 0.6) {
    callouts.push(`${topChannel.channel} traffic has a strong ${(topChannel.engagementRate * 100).toFixed(0)}% engagement rate`);
  }

  // Check for healthy organic
  const organic = data.channels.find((ch) => ch.channel.toLowerCase() === 'organic search');
  if (organic && organic.shareOfTraffic > 0.2) {
    callouts.push(`Organic search drives ${(organic.shareOfTraffic * 100).toFixed(0)}% of traffic — solid SEO foundation`);
  }

  // Check for strong conversion rate
  if (data.kpis.conversionRate.value > 0.02) {
    callouts.push(`Conversion rate of ${(data.kpis.conversionRate.value * 100).toFixed(1)}% exceeds industry average`);
  }

  // Check for leads growth
  const leadsYoY = data.kpis.totalLeads.yoyChange || 0;
  if (leadsYoY > 5) {
    callouts.push(`Leads are up ${leadsYoY.toFixed(0)}% year-over-year`);
  }

  return callouts.slice(0, 3);
}

function generateBadCallouts(data: StoreDashboardData): string[] {
  return data.issues
    .filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
    .slice(0, 3)
    .map((issue) => issue.title);
}

function generateQuickWins(data: StoreDashboardData): string[] {
  const wins: string[] = [];

  // Low-effort, high-impact suggestions
  const unassigned = data.channels.find(
    (ch) => ch.channel.toLowerCase() === 'unassigned'
  );
  if (unassigned && unassigned.shareOfTraffic > 0.05) {
    wins.push('Fix unassigned traffic attribution in GTM — could reveal hidden channel performance');
  }

  if (data.kpis.conversionRate.value < 0.015) {
    wins.push('Add prominent CTAs to top landing pages — fastest path to more leads');
  }

  const mobileBounce = data.devices.find((d) => d.device.toLowerCase() === 'mobile');
  if (mobileBounce && mobileBounce.bounceRate > 0.5) {
    wins.push('Optimize mobile page speed — high mobile bounce rate is costing you leads');
  }

  const organic = data.channels.find((ch) => ch.channel.toLowerCase() === 'organic search');
  if (organic && organic.shareOfTraffic < 0.15) {
    wins.push('Optimize Google Business Profile — quickest way to boost local organic traffic');
  }

  wins.push('Review top 10 landing pages and ensure each has a clear call-to-action');

  return wins.slice(0, 5);
}

// --- Main analysis function ---

export function analyzeStoreData(data: StoreDashboardData): StoreDashboardData {
  issueIdCounter = 0;
  const issues: Issue[] = [];

  // Run all checks
  const checks = [
    checkUnassignedTraffic(data),
    checkBotTraffic(data),
    checkConversionTrackingBreak(data),
    checkLowOrganicSearch(data),
    checkLowConversionRate(data),
    checkHighBounceRate(data),
    checkPhantomEvents(data),
    checkLowEngagementRate(data),
  ];

  for (const issue of checks) {
    if (issue) issues.push(issue);
  }

  // Sort by severity
  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Flag primary market cities
  const store = data.storeName;
  const primaryKeywords = store.includes('Toyota')
    ? ['hernando', 'southaven', 'olive branch', 'horn lake', 'memphis']
    : ['boerne', 'san antonio', 'fair oaks', 'helotes', 'leon valley'];

  for (const city of data.cities) {
    if (primaryKeywords.some((kw) => city.city.toLowerCase().includes(kw))) {
      if (!city.flags.includes('primary-market')) {
        city.flags.push('primary-market');
      }
    }
  }

  // Build the analyzed result
  const analyzed: StoreDashboardData = {
    ...data,
    issues,
  };

  analyzed.goodCallouts = generateGoodCallouts(analyzed);
  analyzed.badCallouts = generateBadCallouts(analyzed);
  analyzed.quickWins = generateQuickWins(analyzed);

  return analyzed;
}
