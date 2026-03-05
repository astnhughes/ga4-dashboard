import { useState } from 'react';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Traffic } from './pages/Traffic';
import { Engagement } from './pages/Engagement';
import { Conversions } from './pages/Conversions';
import { Audience } from './pages/Audience';
import { Technical } from './pages/Technical';
import { useDashboardData } from './hooks/useDashboardData';

function App() {
  const { data, loading, error, refresh, selectedStore, setSelectedStore } = useDashboardData();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-dashboard-text-muted border-t-dashboard-text-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dashboard-text-muted">Loading dashboard data...</p>
        </div>
      </div>
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
      cached={data.cached}
      onRefresh={refresh}
    >
      {activeTab === 'overview' && storeData && <Overview data={storeData} />}
      {activeTab === 'traffic' && storeData && <Traffic data={storeData} />}
      {activeTab === 'engagement' && storeData && <Engagement data={storeData} />}
      {activeTab === 'conversions' && storeData && <Conversions data={storeData} />}
      {activeTab === 'audience' && storeData && <Audience data={storeData} />}
      {activeTab === 'events' && storeData && <Technical data={storeData} />}
    </Layout>
  );
}

export default App;
