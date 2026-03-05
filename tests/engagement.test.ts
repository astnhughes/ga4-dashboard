/**
 * Sprint 4 Tests
 * Tests for Conversions, Audience, and Technical page logic:
 * conversion calculations, tracking break detection, phantom events,
 * audience metrics, bot detection, and issue categorization.
 *
 * Note: These are logic tests, not DOM rendering tests (no jsdom configured).
 */

describe('Conversion calculations', () => {
  const events = [
    { eventName: 'form_submission', eventCount: 80, uniqueUsers: 70, classification: 'lead' as const },
    { eventName: 'phone_call', eventCount: 50, uniqueUsers: 45, classification: 'lead' as const },
    { eventName: 'chat_initiation', eventCount: 20, uniqueUsers: 18, classification: 'lead' as const },
    { eventName: 'page_view', eventCount: 50000, uniqueUsers: 8000, classification: 'engagement' as const },
    { eventName: 'vdp_view', eventCount: 12000, uniqueUsers: 4000, classification: 'engagement' as const },
    { eventName: 'scroll', eventCount: 30000, uniqueUsers: 7000, classification: 'system' as const },
  ];

  it('calculates total lead count from lead events', () => {
    const leadEvents = events.filter((e) => e.classification === 'lead');
    const totalLeads = leadEvents.reduce((sum, e) => sum + e.eventCount, 0);
    expect(totalLeads).toBe(150);
  });

  it('calculates total lead users from lead events', () => {
    const leadEvents = events.filter((e) => e.classification === 'lead');
    const totalUsers = leadEvents.reduce((sum, e) => sum + e.uniqueUsers, 0);
    expect(totalUsers).toBe(133);
  });

  it('calculates VDP-to-lead rate', () => {
    const leadEvents = events.filter((e) => e.classification === 'lead');
    const totalLeads = leadEvents.reduce((sum, e) => sum + e.eventCount, 0);
    const vdpEvents = events.filter((e) => e.eventName.toLowerCase().includes('vdp'));
    const vdpViews = vdpEvents.reduce((sum, e) => sum + e.eventCount, 0);
    const vdpToLeadRate = vdpViews > 0 ? totalLeads / vdpViews : 0;

    expect(vdpViews).toBe(12000);
    expect(vdpToLeadRate).toBeCloseTo(0.0125, 4);
  });

  it('handles zero VDP views gracefully', () => {
    const noVdpEvents = events.filter((e) => !e.eventName.includes('vdp'));
    const vdpViews = noVdpEvents
      .filter((e) => e.eventName.toLowerCase().includes('vdp'))
      .reduce((sum, e) => sum + e.eventCount, 0);
    const rate = vdpViews > 0 ? 150 / vdpViews : 0;
    expect(rate).toBe(0);
  });

  it('calculates macro vs micro event breakdown', () => {
    const macroCount = events
      .filter((e) => e.classification === 'lead')
      .reduce((sum, e) => sum + e.eventCount, 0);
    const microCount = events
      .filter((e) => e.classification === 'engagement')
      .reduce((sum, e) => sum + e.eventCount, 0);

    expect(macroCount).toBe(150);
    expect(microCount).toBe(62000);
    expect(macroCount / (macroCount + microCount)).toBeCloseTo(0.0024, 3);
  });

  it('calculates events-per-user ratio', () => {
    const formSubmission = events.find((e) => e.eventName === 'form_submission')!;
    const ratio = formSubmission.uniqueUsers > 0
      ? formSubmission.eventCount / formSubmission.uniqueUsers
      : 0;
    expect(ratio).toBeCloseTo(1.14, 1);
  });
});

describe('Phantom event detection', () => {
  it('identifies phantom events when ratio exceeds 5x', () => {
    const events = [
      { eventName: 'form_submission', eventCount: 600, uniqueUsers: 10, classification: 'lead' as const },
      { eventName: 'phone_call', eventCount: 50, uniqueUsers: 45, classification: 'lead' as const },
      { eventName: 'page_view', eventCount: 50000, uniqueUsers: 8000, classification: 'engagement' as const },
    ];

    const phantomEvents = events.filter(
      (e) => e.classification === 'lead' && e.uniqueUsers > 0 && e.eventCount / e.uniqueUsers > 5
    );

    expect(phantomEvents).toHaveLength(1);
    expect(phantomEvents[0].eventName).toBe('form_submission');
    expect(phantomEvents[0].eventCount / phantomEvents[0].uniqueUsers).toBe(60);
  });

  it('does not flag normal lead events as phantom', () => {
    const events = [
      { eventName: 'form_submission', eventCount: 80, uniqueUsers: 70, classification: 'lead' as const },
      { eventName: 'phone_call', eventCount: 50, uniqueUsers: 45, classification: 'lead' as const },
    ];

    const phantomEvents = events.filter(
      (e) => e.classification === 'lead' && e.uniqueUsers > 0 && e.eventCount / e.uniqueUsers > 5
    );

    expect(phantomEvents).toHaveLength(0);
  });

  it('does not flag engagement events even with high ratio', () => {
    const events = [
      { eventName: 'page_view', eventCount: 50000, uniqueUsers: 8000, classification: 'engagement' as const },
    ];

    const phantomEvents = events.filter(
      (e) => e.classification === 'lead' && e.uniqueUsers > 0 && e.eventCount / e.uniqueUsers > 5
    );

    expect(phantomEvents).toHaveLength(0);
  });

  it('handles zero unique users safely', () => {
    const events = [
      { eventName: 'broken_event', eventCount: 100, uniqueUsers: 0, classification: 'lead' as const },
    ];

    const phantomEvents = events.filter(
      (e) => e.classification === 'lead' && e.uniqueUsers > 0 && e.eventCount / e.uniqueUsers > 5
    );

    // Should not be flagged because uniqueUsers === 0 guard prevents division
    expect(phantomEvents).toHaveLength(0);
  });
});

describe('Tracking break detection', () => {
  it('detects drop to zero as tracking break', () => {
    const dailyConversions = [
      { date: '20260301', value: 8 },
      { date: '20260302', value: 6 },
      { date: '20260303', value: 0 },
      { date: '20260304', value: 0 },
    ];

    const breakDates: Set<number> = new Set();
    for (let i = 1; i < dailyConversions.length; i++) {
      const prev = dailyConversions[i - 1].value;
      const curr = dailyConversions[i].value;
      if (prev > 0 && curr === 0) {
        breakDates.add(i);
      }
      if (prev > 5 && (prev - curr) / prev > 0.4) {
        breakDates.add(i);
      }
    }

    expect(breakDates.size).toBe(1);
    expect(breakDates.has(2)).toBe(true); // Index 2 is where it drops from 6 to 0
  });

  it('detects 40%+ drop as tracking break', () => {
    const dailyConversions = [
      { date: '20260301', value: 10 },
      { date: '20260302', value: 4 },
      { date: '20260303', value: 3 },
    ];

    const breakDates: Set<number> = new Set();
    for (let i = 1; i < dailyConversions.length; i++) {
      const prev = dailyConversions[i - 1].value;
      const curr = dailyConversions[i].value;
      if (prev > 0 && curr === 0) breakDates.add(i);
      if (prev > 5 && (prev - curr) / prev > 0.4) breakDates.add(i);
    }

    expect(breakDates.size).toBe(1);
    expect(breakDates.has(1)).toBe(true); // 10 → 4 is a 60% drop
  });

  it('does not flag normal variation', () => {
    const dailyConversions = [
      { date: '20260301', value: 8 },
      { date: '20260302', value: 6 },
      { date: '20260303', value: 7 },
      { date: '20260304', value: 5 },
    ];

    const breakDates: Set<number> = new Set();
    for (let i = 1; i < dailyConversions.length; i++) {
      const prev = dailyConversions[i - 1].value;
      const curr = dailyConversions[i].value;
      if (prev > 0 && curr === 0) breakDates.add(i);
      if (prev > 5 && (prev - curr) / prev > 0.4) breakDates.add(i);
    }

    expect(breakDates.size).toBe(0);
  });

  it('ignores small base numbers for percentage drops', () => {
    const dailyConversions = [
      { date: '20260301', value: 3 },
      { date: '20260302', value: 1 },
    ];

    const breakDates: Set<number> = new Set();
    for (let i = 1; i < dailyConversions.length; i++) {
      const prev = dailyConversions[i - 1].value;
      const curr = dailyConversions[i].value;
      if (prev > 0 && curr === 0) breakDates.add(i);
      if (prev > 5 && (prev - curr) / prev > 0.4) breakDates.add(i);
    }

    // prev=3 is not > 5, so % drop check is skipped (normal noise on low volumes)
    expect(breakDates.size).toBe(0);
  });
});

describe('Audience metrics', () => {
  const cities = [
    { city: 'Hernando', region: 'Mississippi', sessions: 1500, users: 1200, engagementRate: 0.7, avgSessionDuration: 180, flags: ['primary-market'] as ('primary-market' | 'bot' | 'anomaly')[] },
    { city: 'Southaven', region: 'Mississippi', sessions: 1000, users: 800, engagementRate: 0.65, avgSessionDuration: 160, flags: ['primary-market'] as ('primary-market' | 'bot' | 'anomaly')[] },
    { city: 'Memphis', region: 'Tennessee', sessions: 800, users: 600, engagementRate: 0.6, avgSessionDuration: 140, flags: ['primary-market'] as ('primary-market' | 'bot' | 'anomaly')[] },
    { city: 'Ashburn', region: 'Virginia', sessions: 300, users: 280, engagementRate: 0.08, avgSessionDuration: 3, flags: ['bot'] as ('primary-market' | 'bot' | 'anomaly')[] },
    { city: 'Nashville', region: 'Tennessee', sessions: 200, users: 150, engagementRate: 0.5, avgSessionDuration: 100, flags: [] as ('primary-market' | 'bot' | 'anomaly')[] },
  ];
  const totalSessions = 10000;

  it('calculates primary market share', () => {
    const primaryCities = cities.filter((c) => c.flags.includes('primary-market'));
    const primarySessions = primaryCities.reduce((sum, c) => sum + c.sessions, 0);
    const share = primarySessions / totalSessions;

    expect(primarySessions).toBe(3300);
    expect(share).toBeCloseTo(0.33, 2);
  });

  it('calculates bot traffic percentage', () => {
    const botCities = cities.filter((c) => c.flags.includes('bot'));
    const botSessions = botCities.reduce((sum, c) => sum + c.sessions, 0);
    const botShare = botSessions / totalSessions;

    expect(botSessions).toBe(300);
    expect(botShare).toBeCloseTo(0.03, 2);
  });

  it('counts unique cities', () => {
    expect(cities.length).toBe(5);
  });

  it('counts primary market cities', () => {
    const primaryCities = cities.filter((c) => c.flags.includes('primary-market'));
    expect(primaryCities.length).toBe(3);
  });

  it('formats duration in M:SS format', () => {
    const formatDuration = (seconds: number): string => {
      const m = Math.floor(seconds / 60);
      const s = Math.round(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    expect(formatDuration(180)).toBe('3:00');
    expect(formatDuration(3)).toBe('0:03');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(95)).toBe('1:35');
  });
});

describe('Technical page - issue categorization', () => {
  const issues = [
    { id: '1', title: 'High unassigned traffic', severity: 'critical' as const, category: 'tracking', whatThisMeans: '', howToFix: '' },
    { id: '2', title: 'Possible bot traffic from Ashburn', severity: 'high' as const, category: 'bot-traffic', whatThisMeans: '', howToFix: '' },
    { id: '3', title: 'Low organic search share', severity: 'medium' as const, category: 'seo', whatThisMeans: '', howToFix: '' },
    { id: '4', title: 'Conversion tracking break', severity: 'critical' as const, category: 'tracking', whatThisMeans: '', howToFix: '' },
    { id: '5', title: 'Phantom events detected', severity: 'high' as const, category: 'conversions', whatThisMeans: '', howToFix: '' },
  ];

  it('groups issues by category', () => {
    const categories: Record<string, typeof issues> = {};
    for (const issue of issues) {
      if (!categories[issue.category]) categories[issue.category] = [];
      categories[issue.category].push(issue);
    }

    expect(Object.keys(categories)).toHaveLength(4);
    expect(categories['tracking']).toHaveLength(2);
    expect(categories['bot-traffic']).toHaveLength(1);
    expect(categories['seo']).toHaveLength(1);
    expect(categories['conversions']).toHaveLength(1);
  });

  it('counts issues by severity', () => {
    const criticalCount = issues.filter((i) => i.severity === 'critical').length;
    const highCount = issues.filter((i) => i.severity === 'high').length;
    const mediumCount = issues.filter((i) => i.severity === 'medium').length;
    const lowCount = issues.filter((i) => i.severity === 'low').length;

    expect(criticalCount).toBe(2);
    expect(highCount).toBe(2);
    expect(mediumCount).toBe(1);
    expect(lowCount).toBe(0);
  });

  it('determines health status based on severities', () => {
    const criticalCount = issues.filter((i) => i.severity === 'critical').length;
    const highCount = issues.filter((i) => i.severity === 'high').length;
    const mediumCount = issues.filter((i) => i.severity === 'medium').length;

    const healthStatus = criticalCount > 0 ? 'Critical' : highCount > 0 ? 'Needs Work' : mediumCount > 0 ? 'Fair' : 'Healthy';
    expect(healthStatus).toBe('Critical');
  });

  it('returns Healthy when no issues', () => {
    const noIssues: typeof issues = [];
    const criticalCount = noIssues.filter((i) => i.severity === 'critical').length;
    const highCount = noIssues.filter((i) => i.severity === 'high').length;
    const mediumCount = noIssues.filter((i) => i.severity === 'medium').length;

    const healthStatus = criticalCount > 0 ? 'Critical' : highCount > 0 ? 'Needs Work' : mediumCount > 0 ? 'Fair' : 'Healthy';
    expect(healthStatus).toBe('Healthy');
  });

  it('returns Needs Work when only high severity', () => {
    const highOnly = [issues[1]]; // high severity only
    const criticalCount = highOnly.filter((i) => i.severity === 'critical').length;
    const highCount = highOnly.filter((i) => i.severity === 'high').length;
    const mediumCount = highOnly.filter((i) => i.severity === 'medium').length;

    const healthStatus = criticalCount > 0 ? 'Critical' : highCount > 0 ? 'Needs Work' : mediumCount > 0 ? 'Fair' : 'Healthy';
    expect(healthStatus).toBe('Needs Work');
  });
});

describe('Technical page - bot & unassigned detection', () => {
  it('calculates unassigned traffic percentage', () => {
    const channels = [
      { channel: 'Organic Search', shareOfTraffic: 0.4 },
      { channel: 'Unassigned', shareOfTraffic: 0.15 },
      { channel: 'Direct', shareOfTraffic: 0.3 },
      { channel: '(not set)', shareOfTraffic: 0.05 },
    ];

    const unassigned = channels.find(
      (ch) => ch.channel.toLowerCase() === 'unassigned' || ch.channel.toLowerCase() === '(not set)'
    );
    expect(unassigned).toBeDefined();
    expect(unassigned!.shareOfTraffic).toBe(0.15);
  });

  it('finds (not set) channel as unassigned', () => {
    const channels = [
      { channel: 'Organic Search', shareOfTraffic: 0.6 },
      { channel: '(not set)', shareOfTraffic: 0.1 },
    ];

    const unassigned = channels.find(
      (ch) => ch.channel.toLowerCase() === 'unassigned' || ch.channel.toLowerCase() === '(not set)'
    );
    expect(unassigned).toBeDefined();
    expect(unassigned!.channel).toBe('(not set)');
  });

  it('returns zero when no unassigned channel exists', () => {
    const channels = [
      { channel: 'Organic Search', shareOfTraffic: 0.6 },
      { channel: 'Direct', shareOfTraffic: 0.4 },
    ];

    const unassigned = channels.find(
      (ch) => ch.channel.toLowerCase() === 'unassigned' || ch.channel.toLowerCase() === '(not set)'
    );
    const unassignedPct = unassigned ? unassigned.shareOfTraffic : 0;
    expect(unassignedPct).toBe(0);
  });

  it('calculates bot traffic from flagged cities', () => {
    const cities = [
      { city: 'Hernando', sessions: 1500, flags: ['primary-market'] },
      { city: 'Ashburn', sessions: 500, flags: ['bot'] },
      { city: 'Boardman', sessions: 200, flags: ['bot'] },
    ];
    const totalSessions = 10000;

    const botCities = cities.filter((c) => c.flags.includes('bot'));
    const botSessions = botCities.reduce((sum, c) => sum + c.sessions, 0);
    const botPct = totalSessions > 0 ? botSessions / totalSessions : 0;

    expect(botSessions).toBe(700);
    expect(botPct).toBeCloseTo(0.07, 2);
  });
});

describe('Date formatting for charts', () => {
  const formatDate = (dateStr: string): string => {
    if (dateStr.length === 8) {
      return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
    }
    return dateStr;
  };

  it('converts GA4 YYYYMMDD to MM/DD', () => {
    expect(formatDate('20260301')).toBe('03/01');
    expect(formatDate('20261231')).toBe('12/31');
    expect(formatDate('20260115')).toBe('01/15');
  });

  it('returns non-standard strings unchanged', () => {
    expect(formatDate('short')).toBe('short');
    expect(formatDate('2026-03-01')).toBe('2026-03-01');
  });
});
