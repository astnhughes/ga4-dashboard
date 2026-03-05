// Store configuration
export type StoreId = 'toyota' | 'infiniti';

export interface StoreConfig {
  id: StoreId;
  name: string;
  ga4PropertyId: string;
  accentColor: string;
  primaryMarket: string;
}

// Severity levels for issue detection
export type Severity = 'critical' | 'high' | 'medium' | 'low';

// Issue detected by the analysis engine
export interface Issue {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  whatThisMeans: string;
  howToFix: string;
  metric?: string;
  value?: number;
  benchmark?: number;
}

// KPI card data
export interface KPIData {
  label: string;
  value: number;
  formattedValue: string;
  yoyChange?: number;
  trend?: number[];
}

// Channel breakdown
export interface ChannelData {
  channel: string;
  sessions: number;
  users: number;
  newUsers: number;
  conversions: number;
  engagementRate: number;
  shareOfTraffic: number;
  shareOfLeads: number;
}

// Device data
export interface DeviceData {
  device: string;
  sessions: number;
  engagementRate: number;
  bounceRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
}

// Page data
export interface PageData {
  pagePath: string;
  sessions: number;
  engagementRate: number;
  bounceRate: number;
  avgSessionDuration: number;
  pageViews: number;
}

// Conversion event data
export interface EventData {
  eventName: string;
  eventCount: number;
  uniqueUsers: number;
  classification: 'lead' | 'engagement' | 'system';
}

// City/Audience data
export interface CityData {
  city: string;
  region: string;
  sessions: number;
  users: number;
  engagementRate: number;
  avgSessionDuration: number;
  flags: ('primary-market' | 'bot' | 'anomaly')[];
}

// Daily trend data point
export interface DailyDataPoint {
  date: string;
  value: number;
}

// Complete store dashboard data
export interface StoreDashboardData {
  storeId: StoreId;
  storeName: string;
  dateRange: { start: string; end: string };
  kpis: {
    totalSessions: KPIData;
    totalUsers: KPIData;
    totalLeads: KPIData;
    conversionRate: KPIData;
  };
  channels: ChannelData[];
  devices: DeviceData[];
  topPages: PageData[];
  events: EventData[];
  cities: CityData[];
  dailySessions: DailyDataPoint[];
  dailyConversions: DailyDataPoint[];
  issues: Issue[];
  goodCallouts: string[];
  badCallouts: string[];
  quickWins: string[];
}

// API response
export interface DashboardResponse {
  stores: Record<StoreId, StoreDashboardData>;
  lastUpdated: string;
  cached: boolean;
}
