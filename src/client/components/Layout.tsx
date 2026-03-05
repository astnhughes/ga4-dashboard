import { StoreId } from '@shared/types';
import { STORES } from '@shared/constants';

interface LayoutProps {
  children: React.ReactNode;
  selectedStore: StoreId;
  onStoreChange: (store: StoreId) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  lastUpdated?: string;
  dateRange?: { start: string; end: string };
  cached?: boolean;
  refreshing?: boolean;
  onRefresh: () => void;
  user?: { name: string; picture: string; email: string };
  onLogout?: () => void;
}

const TABS: { id: string; label: string; disabled?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'conversions', label: 'Conversions' },
  { id: 'audience', label: 'Audience' },
  { id: 'events', label: 'Technical' },
  { id: 'guide', label: 'Guide' },
];

function formatDateRange(dateRange: { start: string; end: string }): string {
  const fmt = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  return `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Layout({
  children,
  selectedStore,
  onStoreChange,
  activeTab,
  onTabChange,
  lastUpdated,
  dateRange,
  cached,
  refreshing,
  onRefresh,
  user,
  onLogout,
}: LayoutProps) {
  const store = STORES[selectedStore];
  const accentColor = store.accentColor;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="border-b border-dashboard-border bg-dashboard-card">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-dashboard-text-primary whitespace-nowrap">
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

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-right">
            {/* Date Range */}
            {dateRange && (
              <span className="text-xs text-dashboard-text-muted hidden md:inline">
                {formatDateRange(dateRange)}
              </span>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <span className="text-xs text-dashboard-text-muted">
                {cached ? 'Cached' : 'Updated'} {timeAgo(lastUpdated)}
              </span>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg text-sm bg-dashboard-bg text-dashboard-text-muted hover:text-dashboard-text-primary border border-dashboard-border transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {refreshing && (
                <div className="w-3 h-3 border border-dashboard-text-muted border-t-dashboard-text-primary rounded-full animate-spin" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-dashboard-border flex items-center justify-center text-xs text-dashboard-text-muted">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="text-xs text-dashboard-text-muted hover:text-dashboard-text-primary transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                disabled={tab.disabled}
                className={`px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
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
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
