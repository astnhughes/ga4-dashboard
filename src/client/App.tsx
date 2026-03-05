import { useState, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { SkeletonPage } from './components/Skeleton';
import { useDashboardData } from './hooks/useDashboardData';

const Overview = lazy(() => import('./pages/Overview').then((m) => ({ default: m.Overview })));
const Traffic = lazy(() => import('./pages/Traffic').then((m) => ({ default: m.Traffic })));
const Engagement = lazy(() => import('./pages/Engagement').then((m) => ({ default: m.Engagement })));
const Conversions = lazy(() => import('./pages/Conversions').then((m) => ({ default: m.Conversions })));
const Audience = lazy(() => import('./pages/Audience').then((m) => ({ default: m.Audience })));
const Technical = lazy(() => import('./pages/Technical').then((m) => ({ default: m.Technical })));

function App() {
  const { data, loading, refreshing, error, refresh, selectedStore, setSelectedStore } = useDashboardData();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <Layout
        selectedStore={selectedStore}
        onStoreChange={setSelectedStore}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={refresh}
      >
        <SkeletonPage />
      </Layout>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-danger text-lg font-semibold mb-2">Failed to load dashboard</p>
          <p className="text-dashboard-text-muted text-sm mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-dashboard-card border border-dashboard-border rounded-lg text-dashboard-text-primary hover:bg-dashboard-card-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const storeData = data.stores[selectedStore];

  return (
    <Layout
      selectedStore={selectedStore}
      onStoreChange={setSelectedStore}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lastUpdated={data.lastUpdated}
      dateRange={storeData?.dateRange}
      cached={data.cached}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <Suspense fallback={<SkeletonPage />}>
        {activeTab === 'overview' && storeData && <Overview data={storeData} />}
        {activeTab === 'traffic' && storeData && <Traffic data={storeData} />}
        {activeTab === 'engagement' && storeData && <Engagement data={storeData} />}
        {activeTab === 'conversions' && storeData && <Conversions data={storeData} />}
        {activeTab === 'audience' && storeData && <Audience data={storeData} />}
        {activeTab === 'events' && storeData && <Technical data={storeData} />}
      </Suspense>
    </Layout>
  );
}

export default App;
