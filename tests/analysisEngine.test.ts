import { analyzeStoreData } from '@server/services/analysisEngine';
import { StoreDashboardData } from '@shared/types';

function makeStoreData(overrides: Partial<StoreDashboardData> = {}): StoreDashboardData {
  return {
    storeId: 'toyota',
    storeName: 'Principle Toyota of Hernando',
    dateRange: { start: '2025-12-06', end: '2026-03-05' },
    kpis: {
      totalSessions: { label: 'Total Sessions', value: 10000, formattedValue: '10K' },
      totalUsers: { label: 'Total Users', value: 8000, formattedValue: '8K' },
      totalLeads: { label: 'Total Leads', value: 150, formattedValue: '150' },
      conversionRate: { label: 'Conversion Rate', value: 0.015, formattedValue: '1.5%' },
    },
    channels: [
      { channel: 'Organic Search', sessions: 4000, users: 3500, newUsers: 3000, conversions: 60, engagementRate: 0.65, shareOfTraffic: 0.4, shareOfLeads: 0.4 },
      { channel: 'Paid Search', sessions: 3000, users: 2500, newUsers: 2200, conversions: 50, engagementRate: 0.55, shareOfTraffic: 0.3, shareOfLeads: 0.33 },
      { channel: 'Direct', sessions: 2000, users: 1500, newUsers: 500, conversions: 30, engagementRate: 0.7, shareOfTraffic: 0.2, shareOfLeads: 0.2 },
      { channel: 'Referral', sessions: 1000, users: 500, newUsers: 400, conversions: 10, engagementRate: 0.5, shareOfTraffic: 0.1, shareOfLeads: 0.07 },
    ],
    devices: [
      { device: 'mobile', sessions: 6000, engagementRate: 0.55, bounceRate: 0.35, avgSessionDuration: 120, pagesPerSession: 2.5 },
      { device: 'desktop', sessions: 3500, engagementRate: 0.7, bounceRate: 0.25, avgSessionDuration: 200, pagesPerSession: 4 },
      { device: 'tablet', sessions: 500, engagementRate: 0.6, bounceRate: 0.3, avgSessionDuration: 150, pagesPerSession: 3 },
    ],
    topPages: [],
    events: [
      { eventName: 'form_submission', eventCount: 80, uniqueUsers: 70, classification: 'lead' },
      { eventName: 'phone_call', eventCount: 50, uniqueUsers: 45, classification: 'lead' },
      { eventName: 'page_view', eventCount: 50000, uniqueUsers: 8000, classification: 'engagement' },
    ],
    cities: [
      { city: 'Hernando', region: 'Mississippi', sessions: 1500, users: 1200, engagementRate: 0.7, avgSessionDuration: 180, flags: [] },
      { city: 'Southaven', region: 'Mississippi', sessions: 1000, users: 800, engagementRate: 0.65, avgSessionDuration: 160, flags: [] },
      { city: 'Memphis', region: 'Tennessee', sessions: 800, users: 600, engagementRate: 0.6, avgSessionDuration: 140, flags: [] },
    ],
    dailySessions: [
      { date: '20260301', value: 120 },
      { date: '20260302', value: 115 },
      { date: '20260303', value: 130 },
    ],
    dailyConversions: [
      { date: '20260301', value: 5 },
      { date: '20260302', value: 4 },
      { date: '20260303', value: 6 },
    ],
    issues: [],
    goodCallouts: [],
    badCallouts: [],
    quickWins: [],
    ...overrides,
  };
}

describe('analyzeStoreData', () => {
  it('returns data with issues array', () => {
    const result = analyzeStoreData(makeStoreData());
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it('generates good callouts for healthy data', () => {
    const data = makeStoreData({
      kpis: {
        totalSessions: { label: 'Total Sessions', value: 10000, formattedValue: '10K', yoyChange: 15 },
        totalUsers: { label: 'Total Users', value: 8000, formattedValue: '8K', yoyChange: 12 },
        totalLeads: { label: 'Total Leads', value: 150, formattedValue: '150', yoyChange: 8 },
        conversionRate: { label: 'Conversion Rate', value: 0.025, formattedValue: '2.5%', yoyChange: 5 },
      },
    });
    const result = analyzeStoreData(data);
    expect(result.goodCallouts.length).toBeGreaterThan(0);
  });

  it('generates quick wins', () => {
    const result = analyzeStoreData(makeStoreData());
    expect(result.quickWins.length).toBeGreaterThan(0);
  });

  it('detects unassigned traffic when critical threshold exceeded', () => {
    const data = makeStoreData({
      channels: [
        { channel: 'Unassigned', sessions: 2000, users: 1500, newUsers: 1000, conversions: 5, engagementRate: 0.2, shareOfTraffic: 0.2, shareOfLeads: 0.03 },
        { channel: 'Organic Search', sessions: 8000, users: 7000, newUsers: 6000, conversions: 145, engagementRate: 0.65, shareOfTraffic: 0.8, shareOfLeads: 0.97 },
      ],
    });
    const result = analyzeStoreData(data);
    const unassignedIssue = result.issues.find((i) => i.title.includes('Unassigned'));
    expect(unassignedIssue).toBeDefined();
    expect(unassignedIssue!.severity).toBe('critical');
  });

  it('detects bot traffic from suspect cities', () => {
    const data = makeStoreData({
      cities: [
        { city: 'Ashburn', region: 'Virginia', sessions: 500, users: 450, engagementRate: 0.1, avgSessionDuration: 5, flags: [] },
        { city: 'Hernando', region: 'Mississippi', sessions: 1500, users: 1200, engagementRate: 0.7, avgSessionDuration: 180, flags: [] },
      ],
    });
    const result = analyzeStoreData(data);
    const botIssue = result.issues.find((i) => i.title.includes('bot'));
    expect(botIssue).toBeDefined();
    expect(botIssue!.severity).toBe('high');
    // Check that the city was flagged
    const ashburn = result.cities.find((c) => c.city === 'Ashburn');
    expect(ashburn!.flags).toContain('bot');
  });

  it('detects conversion tracking break (drop to zero)', () => {
    const data = makeStoreData({
      dailyConversions: [
        { date: '20260301', value: 8 },
        { date: '20260302', value: 0 },
        { date: '20260303', value: 0 },
      ],
    });
    const result = analyzeStoreData(data);
    const trackingIssue = result.issues.find((i) => i.title.includes('tracking'));
    expect(trackingIssue).toBeDefined();
    expect(trackingIssue!.severity).toBe('critical');
  });

  it('detects low organic search share', () => {
    const data = makeStoreData({
      channels: [
        { channel: 'Organic Search', sessions: 1000, users: 800, newUsers: 700, conversions: 20, engagementRate: 0.6, shareOfTraffic: 0.1, shareOfLeads: 0.13 },
        { channel: 'Paid Search', sessions: 9000, users: 7200, newUsers: 6500, conversions: 130, engagementRate: 0.55, shareOfTraffic: 0.9, shareOfLeads: 0.87 },
      ],
    });
    const result = analyzeStoreData(data);
    const seoIssue = result.issues.find((i) => i.title.includes('Organic'));
    expect(seoIssue).toBeDefined();
    expect(seoIssue!.severity).toBe('medium');
  });

  it('detects phantom events', () => {
    const data = makeStoreData({
      events: [
        { eventName: 'form_submission', eventCount: 600, uniqueUsers: 10, classification: 'lead' },
        { eventName: 'page_view', eventCount: 50000, uniqueUsers: 8000, classification: 'engagement' },
      ],
    });
    const result = analyzeStoreData(data);
    const phantomIssue = result.issues.find((i) => i.title.includes('phantom'));
    expect(phantomIssue).toBeDefined();
    expect(phantomIssue!.severity).toBe('high');
  });

  it('flags primary market cities for Toyota', () => {
    const result = analyzeStoreData(makeStoreData());
    const hernando = result.cities.find((c) => c.city === 'Hernando');
    expect(hernando!.flags).toContain('primary-market');
    const memphis = result.cities.find((c) => c.city === 'Memphis');
    expect(memphis!.flags).toContain('primary-market');
  });

  it('flags primary market cities for INFINITI', () => {
    const data = makeStoreData({
      storeId: 'infiniti',
      storeName: 'Principle INFINITI of Boerne',
      cities: [
        { city: 'San Antonio', region: 'Texas', sessions: 2000, users: 1500, engagementRate: 0.65, avgSessionDuration: 160, flags: [] },
        { city: 'Boerne', region: 'Texas', sessions: 500, users: 400, engagementRate: 0.7, avgSessionDuration: 180, flags: [] },
      ],
    });
    const result = analyzeStoreData(data);
    const sanAntonio = result.cities.find((c) => c.city === 'San Antonio');
    expect(sanAntonio!.flags).toContain('primary-market');
  });

  it('sorts issues by severity (critical first)', () => {
    const data = makeStoreData({
      channels: [
        { channel: 'Unassigned', sessions: 2000, users: 1500, newUsers: 1000, conversions: 5, engagementRate: 0.2, shareOfTraffic: 0.2, shareOfLeads: 0.03 },
        { channel: 'Organic Search', sessions: 1000, users: 800, newUsers: 700, conversions: 20, engagementRate: 0.6, shareOfTraffic: 0.1, shareOfLeads: 0.13 },
      ],
      dailyConversions: [
        { date: '20260301', value: 8 },
        { date: '20260302', value: 0 },
      ],
    });
    const result = analyzeStoreData(data);
    if (result.issues.length >= 2) {
      const severityOrder = ['critical', 'high', 'medium', 'low'];
      for (let i = 1; i < result.issues.length; i++) {
        const prevIdx = severityOrder.indexOf(result.issues[i - 1].severity);
        const currIdx = severityOrder.indexOf(result.issues[i].severity);
        expect(prevIdx).toBeLessThanOrEqual(currIdx);
      }
    }
  });

  it('does not flag issues when data is healthy', () => {
    const data = makeStoreData();
    const result = analyzeStoreData(data);
    // With healthy data, should have minimal issues
    const criticalIssues = result.issues.filter((i) => i.severity === 'critical');
    expect(criticalIssues.length).toBe(0);
  });
});
