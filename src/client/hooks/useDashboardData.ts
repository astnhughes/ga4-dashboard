import { useState, useEffect, useCallback } from 'react';
import { DashboardResponse, StoreId } from '@shared/types';

interface UseDashboardDataReturn {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  selectedStore: StoreId;
  setSelectedStore: (store: StoreId) => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreId>('toyota');

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refresh, selectedStore, setSelectedStore };
}
