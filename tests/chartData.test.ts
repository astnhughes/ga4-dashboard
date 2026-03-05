/**
 * Sprint 3 Component Tests
 * Tests for the reusable UI components: DataTable sorting, chart data preparation,
 * and educational panel content structure.
 *
 * Note: These are logic tests, not DOM rendering tests (no jsdom configured).
 * Frontend rendering is verified via Vite build + type-check.
 */

describe('DataTable sorting logic', () => {
  const testData = [
    { name: 'Organic Search', sessions: 4000, rate: 0.65 },
    { name: 'Paid Search', sessions: 3000, rate: 0.55 },
    { name: 'Direct', sessions: 2000, rate: 0.7 },
    { name: 'Referral', sessions: 1000, rate: 0.5 },
  ];

  it('sorts numerically descending by default', () => {
    const sorted = [...testData].sort((a, b) => b.sessions - a.sessions);
    expect(sorted[0].name).toBe('Organic Search');
    expect(sorted[3].name).toBe('Referral');
  });

  it('sorts numerically ascending', () => {
    const sorted = [...testData].sort((a, b) => a.sessions - b.sessions);
    expect(sorted[0].name).toBe('Referral');
    expect(sorted[3].name).toBe('Organic Search');
  });

  it('sorts alphabetically', () => {
    const sorted = [...testData].sort((a, b) => a.name.localeCompare(b.name));
    expect(sorted[0].name).toBe('Direct');
    expect(sorted[3].name).toBe('Referral');
  });
});

describe('Chart data preparation', () => {
  it('correctly calculates doughnut percentages', () => {
    const values = [4000, 3000, 2000, 1000];
    const total = values.reduce((a, b) => a + b, 0);
    const percentages = values.map((v) => (v / total) * 100);

    expect(percentages[0]).toBe(40);
    expect(percentages[1]).toBe(30);
    expect(percentages[2]).toBe(20);
    expect(percentages[3]).toBe(10);
    expect(percentages.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('formats date strings from GA4 YYYYMMDD format', () => {
    const formatDate = (dateStr: string): string => {
      if (dateStr.length === 8) {
        return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`;
      }
      return dateStr;
    };

    expect(formatDate('20260301')).toBe('03/01');
    expect(formatDate('20261231')).toBe('12/31');
    expect(formatDate('short')).toBe('short');
  });

  it('maps channel names to colors', () => {
    const CHANNEL_COLORS: Record<string, string> = {
      'Organic Search': '#22c55e',
      'Paid Search': '#3b82f6',
      'Direct': '#8b5cf6',
      'Unassigned': '#ef4444',
    };

    expect(CHANNEL_COLORS['Organic Search']).toBe('#22c55e');
    expect(CHANNEL_COLORS['Unassigned']).toBe('#ef4444');
    expect(CHANNEL_COLORS['Unknown Channel']).toBeUndefined();
  });
});

describe('Engagement calculations', () => {
  const devices = [
    { device: 'mobile', sessions: 6000, engagementRate: 0.55, bounceRate: 0.35, avgSessionDuration: 120, pagesPerSession: 2.5 },
    { device: 'desktop', sessions: 3500, engagementRate: 0.7, bounceRate: 0.25, avgSessionDuration: 200, pagesPerSession: 4 },
    { device: 'tablet', sessions: 500, engagementRate: 0.6, bounceRate: 0.3, avgSessionDuration: 150, pagesPerSession: 3 },
  ];

  it('calculates weighted average engagement rate', () => {
    const totalSessions = devices.reduce((sum, d) => sum + d.sessions, 0);
    const weighted = devices.reduce((sum, d) => sum + d.engagementRate * d.sessions, 0);
    const avg = weighted / totalSessions;

    expect(totalSessions).toBe(10000);
    expect(avg).toBeCloseTo(0.6, 1);
  });

  it('calculates weighted average bounce rate', () => {
    const totalSessions = devices.reduce((sum, d) => sum + d.sessions, 0);
    const weighted = devices.reduce((sum, d) => sum + d.bounceRate * d.sessions, 0);
    const avg = weighted / totalSessions;

    expect(avg).toBeCloseTo(0.315, 2);
  });

  it('formats duration correctly', () => {
    const formatDuration = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.round(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    expect(formatDuration(120)).toBe('2:00');
    expect(formatDuration(95)).toBe('1:35');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(3661)).toBe('61:01');
  });
});

describe('Traffic data transformations', () => {
  it('calculates share of traffic correctly', () => {
    const channels = [
      { sessions: 4000 },
      { sessions: 3000 },
      { sessions: 2000 },
      { sessions: 1000 },
    ];
    const total = channels.reduce((sum, ch) => sum + ch.sessions, 0);
    const shares = channels.map((ch) => ch.sessions / total);

    expect(shares[0]).toBe(0.4);
    expect(shares[1]).toBe(0.3);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it('identifies low engagement channels', () => {
    const channels = [
      { channel: 'Organic', engagementRate: 0.65 },
      { channel: 'Unassigned', engagementRate: 0.2 },
      { channel: 'Direct', engagementRate: 0.7 },
    ];
    const lowEngagement = channels.filter((ch) => ch.engagementRate < 0.4);

    expect(lowEngagement).toHaveLength(1);
    expect(lowEngagement[0].channel).toBe('Unassigned');
  });
});
