import { Router, Request, Response } from 'express';
import { fetchStoreData, fetchAllStoresData } from '../services/ga4Service';
import { analyzeStoreData } from '../services/analysisEngine';
import { DashboardResponse, StoreDashboardData, StoreId } from '../../shared/types';

const router = Router();

// In-memory cache with TTL
let cache: { data: DashboardResponse; expiresAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function isCacheValid(): boolean {
  return cache !== null && Date.now() < cache.expiresAt;
}

// GET /api/dashboard-data — returns analyzed data for all stores
router.get('/dashboard-data', async (_req: Request, res: Response) => {
  try {
    if (isCacheValid()) {
      res.json({ ...cache!.data, cached: true });
      return;
    }

    const rawData = await fetchAllStoresData();

    // Run analysis engine on each store
    const stores: Record<string, StoreDashboardData> = {};
    for (const [storeId, data] of Object.entries(rawData)) {
      stores[storeId] = analyzeStoreData(data);
    }

    const response: DashboardResponse = {
      stores: stores as Record<StoreId, StoreDashboardData>,
      lastUpdated: new Date().toISOString(),
      cached: false,
    };

    cache = { data: response, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/store/:storeId — returns analyzed data for a single store
router.get('/store/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    if (storeId !== 'toyota' && storeId !== 'infiniti') {
      res.status(400).json({ error: 'Invalid store ID. Use "toyota" or "infiniti".' });
      return;
    }

    // Check cache for individual store
    if (isCacheValid() && cache!.data.stores[storeId]) {
      res.json({ store: cache!.data.stores[storeId], cached: true });
      return;
    }

    const rawData = await fetchStoreData(storeId as StoreId);
    const analyzed = analyzeStoreData(rawData);

    res.json({ store: analyzed, cached: false });
  } catch (error) {
    console.error(`Error fetching store ${req.params.storeId}:`, error);
    res.status(500).json({
      error: 'Failed to fetch store data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/refresh — force cache refresh
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    cache = null;

    const rawData = await fetchAllStoresData();
    const stores: Record<string, StoreDashboardData> = {};
    for (const [storeId, data] of Object.entries(rawData)) {
      stores[storeId] = analyzeStoreData(data);
    }

    const response: DashboardResponse = {
      stores: stores as Record<StoreId, StoreDashboardData>,
      lastUpdated: new Date().toISOString(),
      cached: false,
    };

    cache = { data: response, expiresAt: Date.now() + CACHE_TTL_MS };
    res.json(response);
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    res.status(500).json({
      error: 'Failed to refresh dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
