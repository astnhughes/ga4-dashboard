import { StoreId } from '@shared/types';
import { STORES } from '@shared/constants';

interface LayoutProps {
  children: React.ReactNode;
  selectedStore: StoreId;
  onStoreChange: (store: StoreId) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  lastUpdated?: string;
  cached?: boolean;
  onRefresh: () => void;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'conversions', label: 'Conversions', disabled: true },
  { id: 'audience', label: 'Audience', disabled: true },
  { id: 'events', label: 'Events', disabled: true },
];

export function Layout({
  children,
  selectedStore,
  onStoreChange,
  activeTab,
  onTabChange,
  lastUpdated,
  cached,
  onRefresh,
}: LayoutProps) {
  const store = STORES[selectedStore];
  const accentColor = store.accentColor;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="border-b border-dashboard-border bg-dashboard-card">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-dashboard-text-primary">
              GA4 Dashboard
            </h1>

            {/* Store Switcher */}
            <div className="flex gap-2">
              {(Object.keys(STORES) as StoreId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => onStoreChange(id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedStore === id
                      ? 'text-white'
                      : 'text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-bg'
                  }`}
                  style={
                    selectedStore === id
                      ? { backgroundColor: STORES[id].accentColor + '33', color: STORES[id].accentColor, borderColor: STORES[id].accentColor + '55', borderWidth: 1 }
                      : {}
                  }
                >
                  {STORES[id].name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-dashboard-text-muted">
                {cached ? 'Cached' : 'Updated'} {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg text-sm bg-dashboard-bg text-dashboard-text-muted hover:text-dashboard-text-primary border border-dashboard-border transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1600px] mx-auto px-6">
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                disabled={tab.disabled}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-dashboard-text-primary border-b-2'
                    : tab.disabled
                    ? 'text-dashboard-text-muted/40 cursor-not-allowed'
                    : 'text-dashboard-text-muted hover:text-dashboard-text-primary'
                }`}
                style={
                  activeTab === tab.id
                    ? { borderBottomColor: accentColor }
                    : {}
                }
              >
                {tab.label}
                {tab.disabled && <span className="ml-1 text-xs">(S4)</span>}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
