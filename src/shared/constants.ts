import { StoreConfig } from './types';

export const STORES: Record<string, StoreConfig> = {
  toyota: {
    id: 'toyota',
    name: 'Principle Toyota of Hernando',
    ga4PropertyId: '358670218',
    accentColor: '#dc2626',
    primaryMarket: 'Hernando, MS',
  },
  infiniti: {
    id: 'infiniti',
    name: 'Principle INFINITI of Boerne',
    ga4PropertyId: '308058481',
    accentColor: '#6366f1',
    primaryMarket: 'San Antonio / Boerne, TX',
  },
};

export const BENCHMARKS = {
  unassignedTrafficCritical: 0.1,
  unassignedTrafficHigh: 0.05,
  botEngagementThreshold: 0.4,
  conversionDropThreshold: 0.4,
  organicSearchMinShare: 0.15,
  siteConversionRate: 0.015,
  bounceRateMax: 0.4,
  phantomEventRatio: 5,
  engagementRateMin: 0.55,
};

export const DATE_RANGE_DAYS = 90;
