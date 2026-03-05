import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardResponse, StoreId } from '@shared/types';

interface UseDashboardDataReturn {
  data: DashboardResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
  selectedStore: StoreId;
  setSelectedStore: (store: StoreId) => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 8000]; // exponential-ish backoff

function friendlyError(err: unknown): string {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  if (err instanceof Error) {
    if (err.message.includes('401') || err.message.includes('403')) {
      return 'Authentication failed. Please sign in again.';
    }
    if (err.message.includes('500')) {
      return 'The server encountered an error processing GA4 data. Try refreshing in a moment.';
    }
    if (err.message.includes('429')) {
      return 'Too many requests. The GA4 API rate limit was hit — data will refresh automatically soon.';
    }
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreId>('toyota');
  const retryCount = useRef(0);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = forceRefresh ? '/api/refresh' : '/api/dashboard-data';
      const options = forceRefresh ? { method: 'POST' } : {};
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      retryCount.current = 0;
    } catch (err) {
      // Retry with backoff on initial load (not manual refresh)
      if (!forceRefresh && retryCount.current < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount.current];
        retryCount.current += 1;
        setTimeout(() => fetchData(false), delay);
        return; // Don't set error yet, still retrying
      }
      setError(friendlyError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    retryCount.current = 0;
    fetchData(true);
  }, [fetchData]);

  return { data, loading, refreshing, error, refresh, selectedStore, setSelectedStore };
}
