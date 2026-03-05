import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { STORES, DATE_RANGE_DAYS } from '../../shared/constants';
import {
  StoreId,
  ChannelData,
  DeviceData,
  PageData,
  EventData,
  CityData,
  DailyDataPoint,
  KPIData,
  StoreDashboardData,
} from '../../shared/types';

const analyticsClient = new BetaAnalyticsDataClient();

function getDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - DATE_RANGE_DAYS);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function getYoYDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  end.setFullYear(end.getFullYear() - 1);
  start.setFullYear(start.getFullYear() - 1);
  start.setDate(end.getDate() - DATE_RANGE_DAYS);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

async function fetchTrafficData(propertyId: string) {
  const { startDate, endDate } = getDateRange();
  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'sessionDefaultChannelGroup' },
      { name: 'date' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'conversions' },
      { name: 'engagementRate' },
    ],
  });
  return response;
}

async function fetchEngagementData(propertyId: string) {
  const { startDate, endDate } = getDateRange();
  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'deviceCategory' },
      { name: 'pagePath' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'engagementRate' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'screenPageViewsPerSession' },
    ],
    limit: 100,
  });
  return response;
}

async function fetchConversionData(propertyId: string) {
  const { startDate, endDate } = getDateRange();
  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'eventName' },
      { name: 'date' },
    ],
    metrics: [
      { name: 'eventCount' },
      { name: 'conversions' },
      { name: 'totalUsers' },
    ],
  });
  return response;
}

async function fetchAudienceData(propertyId: string) {
  const { startDate, endDate } = getDateRange();
  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'city' },
      { name: 'region' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'engagementRate' },
      { name: 'averageSessionDuration' },
    ],
    limit: 50,
  });
  return response;
}

async function fetchYoYData(propertyId: string) {
  const current = getDateRange();
  const previous = getYoYDateRange();
  const [response] = await analyticsClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      { startDate: current.startDate, endDate: current.endDate, name: 'current' },
      { startDate: previous.startDate, endDate: previous.endDate, name: 'previous' },
    ],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'conversions' },
    ],
  });
  return response;
}

// --- Data transformation helpers ---

function parseTrafficData(response: any): {
  channels: ChannelData[];
  dailySessions: DailyDataPoint[];
  totalSessions: number;
  totalUsers: number;
  totalNewUsers: number;
  totalConversions: number;
} {
  const channelMap: Record<string, ChannelData> = {};
  const dailyMap: Record<string, number> = {};
  let totalSessions = 0;
  let totalUsers = 0;
  let totalNewUsers = 0;
  let totalConversions = 0;

  for (const row of response.rows || []) {
    const channel = row.dimensionValues?.[0]?.value || 'Unknown';
    const date = row.dimensionValues?.[1]?.value || '';
    const sessions = parseInt(row.metricValues?.[0]?.value || '0');
    const users = parseInt(row.metricValues?.[1]?.value || '0');
    const newUsers = parseInt(row.metricValues?.[2]?.value || '0');
    const conversions = parseInt(row.metricValues?.[3]?.value || '0');
    const engagementRate = parseFloat(row.metricValues?.[4]?.value || '0');

    if (!channelMap[channel]) {
      channelMap[channel] = {
        channel,
        sessions: 0,
        users: 0,
        newUsers: 0,
        conversions: 0,
        engagementRate: 0,
        shareOfTraffic: 0,
        shareOfLeads: 0,
      };
    }
    channelMap[channel].sessions += sessions;
    channelMap[channel].users += users;
    channelMap[channel].newUsers += newUsers;
    channelMap[channel].conversions += conversions;
    // Weighted average for engagement rate
    channelMap[channel].engagementRate = engagementRate;

    dailyMap[date] = (dailyMap[date] || 0) + sessions;
    totalSessions += sessions;
    totalUsers += users;
    totalNewUsers += newUsers;
    totalConversions += conversions;
  }

  const channels = Object.values(channelMap).map((ch) => ({
    ...ch,
    shareOfTraffic: totalSessions > 0 ? ch.sessions / totalSessions : 0,
    shareOfLeads: totalConversions > 0 ? ch.conversions / totalConversions : 0,
  }));

  channels.sort((a, b) => b.sessions - a.sessions);

  const dailySessions = Object.entries(dailyMap)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { channels, dailySessions, totalSessions, totalUsers, totalNewUsers, totalConversions };
}

function parseEngagementData(response: any): {
  devices: DeviceData[];
  topPages: PageData[];
} {
  const deviceMap: Record<string, DeviceData> = {};
  const pageMap: Record<string, PageData> = {};

  for (const row of response.rows || []) {
    const device = row.dimensionValues?.[0]?.value || 'Unknown';
    const pagePath = row.dimensionValues?.[1]?.value || '/';
    const sessions = parseInt(row.metricValues?.[0]?.value || '0');
    const engagementRate = parseFloat(row.metricValues?.[1]?.value || '0');
    const bounceRate = parseFloat(row.metricValues?.[2]?.value || '0');
    const avgSessionDuration = parseFloat(row.metricValues?.[3]?.value || '0');
    const pagesPerSession = parseFloat(row.metricValues?.[4]?.value || '0');

    if (!deviceMap[device]) {
      deviceMap[device] = {
        device,
        sessions: 0,
        engagementRate: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        pagesPerSession: 0,
      };
    }
    deviceMap[device].sessions += sessions;
    deviceMap[device].engagementRate = engagementRate;
    deviceMap[device].bounceRate = bounceRate;
    deviceMap[device].avgSessionDuration = avgSessionDuration;
    deviceMap[device].pagesPerSession = pagesPerSession;

    if (!pageMap[pagePath]) {
      pageMap[pagePath] = {
        pagePath,
        sessions: 0,
        engagementRate: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        pageViews: 0,
      };
    }
    pageMap[pagePath].sessions += sessions;
    pageMap[pagePath].engagementRate = engagementRate;
    pageMap[pagePath].bounceRate = bounceRate;
    pageMap[pagePath].avgSessionDuration = avgSessionDuration;
    pageMap[pagePath].pageViews += sessions;
  }

  const devices = Object.values(deviceMap).sort((a, b) => b.sessions - a.sessions);
  const topPages = Object.values(pageMap)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  return { devices, topPages };
}

function parseConversionData(response: any): {
  events: EventData[];
  dailyConversions: DailyDataPoint[];
} {
  const eventMap: Record<string, EventData> = {};
  const dailyMap: Record<string, number> = {};

  const leadEvents = [
    'form_submission', 'phone_call', 'chat_start', 'contact_dealer',
    'get_directions', 'schedule_service', 'request_quote',
    'asc_form_submission', 'mcm_form_submission',
  ];
  const engagementEvents = [
    'page_view', 'scroll', 'click', 'file_download', 'video_start',
    'vehicle_detail_page', 'vdp_view', 'srp_view',
  ];

  for (const row of response.rows || []) {
    const eventName = row.dimensionValues?.[0]?.value || '';
    const date = row.dimensionValues?.[1]?.value || '';
    const eventCount = parseInt(row.metricValues?.[0]?.value || '0');
    const conversions = parseInt(row.metricValues?.[1]?.value || '0');
    const uniqueUsers = parseInt(row.metricValues?.[2]?.value || '0');

    if (!eventMap[eventName]) {
      let classification: 'lead' | 'engagement' | 'system' = 'system';
      if (leadEvents.some((e) => eventName.toLowerCase().includes(e.toLowerCase()))) {
        classification = 'lead';
      } else if (engagementEvents.some((e) => eventName.toLowerCase().includes(e.toLowerCase()))) {
        classification = 'engagement';
      }

      eventMap[eventName] = {
        eventName,
        eventCount: 0,
        uniqueUsers: 0,
        classification,
      };
    }
    eventMap[eventName].eventCount += eventCount;
    eventMap[eventName].uniqueUsers += uniqueUsers;

    if (conversions > 0) {
      dailyMap[date] = (dailyMap[date] || 0) + conversions;
    }
  }

  const events = Object.values(eventMap).sort((a, b) => b.eventCount - a.eventCount);
  const dailyConversions = Object.entries(dailyMap)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { events, dailyConversions };
}

function parseAudienceData(response: any): CityData[] {
  const cityMap: Record<string, CityData> = {};

  for (const row of response.rows || []) {
    const city = row.dimensionValues?.[0]?.value || 'Unknown';
    const region = row.dimensionValues?.[1]?.value || '';
    const sessions = parseInt(row.metricValues?.[0]?.value || '0');
    const users = parseInt(row.metricValues?.[1]?.value || '0');
    const engagementRate = parseFloat(row.metricValues?.[2]?.value || '0');
    const avgSessionDuration = parseFloat(row.metricValues?.[3]?.value || '0');

    const key = `${city}-${region}`;
    if (!cityMap[key]) {
      cityMap[key] = {
        city,
        region,
        sessions: 0,
        users: 0,
        engagementRate: 0,
        avgSessionDuration: 0,
        flags: [],
      };
    }
    cityMap[key].sessions += sessions;
    cityMap[key].users += users;
    cityMap[key].engagementRate = engagementRate;
    cityMap[key].avgSessionDuration = avgSessionDuration;
  }

  return Object.values(cityMap).sort((a, b) => b.sessions - a.sessions);
}

function parseYoYData(response: any): {
  currentTotals: { sessions: number; users: number; conversions: number };
  previousTotals: { sessions: number; users: number; conversions: number };
} {
  let currentSessions = 0, currentUsers = 0, currentConversions = 0;
  let previousSessions = 0, previousUsers = 0, previousConversions = 0;

  for (const row of response.rows || []) {
    const sessions = parseInt(row.metricValues?.[0]?.value || '0');
    const users = parseInt(row.metricValues?.[1]?.value || '0');
    const conversions = parseInt(row.metricValues?.[2]?.value || '0');

    // First date range = current, second = previous
    // GA4 returns rows for each date range combination
    // We need to check which date range this row belongs to
    if (response.rows.indexOf(row) < response.rows.length / 2) {
      currentSessions += sessions;
      currentUsers += users;
      currentConversions += conversions;
    } else {
      previousSessions += sessions;
      previousUsers += users;
      previousConversions += conversions;
    }
  }

  return {
    currentTotals: { sessions: currentSessions, users: currentUsers, conversions: currentConversions },
    previousTotals: { sessions: previousSessions, users: previousUsers, conversions: previousConversions },
  };
}

function calcYoYChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function buildKPI(label: string, value: number, formatted: string, yoyChange?: number): KPIData {
  return {
    label,
    value,
    formattedValue: formatted,
    yoyChange,
  };
}

// --- Main fetch function ---

export async function fetchStoreData(storeId: StoreId): Promise<StoreDashboardData> {
  const store = STORES[storeId];
  const propertyId = store.ga4PropertyId;
  const { startDate, endDate } = getDateRange();

  // Run all 5 API calls in parallel
  const [trafficRaw, engagementRaw, conversionRaw, audienceRaw, yoyRaw] = await Promise.all([
    fetchTrafficData(propertyId),
    fetchEngagementData(propertyId),
    fetchConversionData(propertyId),
    fetchAudienceData(propertyId),
    fetchYoYData(propertyId),
  ]);

  // Parse responses
  const { channels, dailySessions, totalSessions, totalUsers, totalNewUsers, totalConversions } =
    parseTrafficData(trafficRaw);
  const { devices, topPages } = parseEngagementData(engagementRaw);
  const { events, dailyConversions } = parseConversionData(conversionRaw);
  const cities = parseAudienceData(audienceRaw);
  const { currentTotals, previousTotals } = parseYoYData(yoyRaw);

  // Build KPIs with YoY
  const conversionRate = totalSessions > 0 ? totalConversions / totalSessions : 0;
  const prevConversionRate =
    previousTotals.sessions > 0 ? previousTotals.conversions / previousTotals.sessions : 0;

  const kpis = {
    totalSessions: buildKPI(
      'Total Sessions',
      totalSessions,
      formatNumber(totalSessions),
      calcYoYChange(totalSessions, previousTotals.sessions)
    ),
    totalUsers: buildKPI(
      'Total Users',
      totalUsers,
      formatNumber(totalUsers),
      calcYoYChange(totalUsers, previousTotals.users)
    ),
    totalLeads: buildKPI(
      'Total Leads',
      totalConversions,
      formatNumber(totalConversions),
      calcYoYChange(totalConversions, previousTotals.conversions)
    ),
    conversionRate: buildKPI(
      'Conversion Rate',
      conversionRate,
      formatPercent(conversionRate),
      calcYoYChange(conversionRate, prevConversionRate)
    ),
  };

  return {
    storeId,
    storeName: store.name,
    dateRange: { start: startDate, end: endDate },
    kpis,
    channels,
    devices,
    topPages,
    events,
    cities,
    dailySessions,
    dailyConversions,
    issues: [], // Will be populated by analysis engine
    goodCallouts: [],
    badCallouts: [],
    quickWins: [],
  };
}

export async function fetchAllStoresData(): Promise<Record<StoreId, StoreDashboardData>> {
  const [toyota, infiniti] = await Promise.all([
    fetchStoreData('toyota'),
    fetchStoreData('infiniti'),
  ]);

  return { toyota, infiniti };
}
