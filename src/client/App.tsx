function App() {
  return (
    <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-dashboard-text-primary mb-4">
          GA4 Analytics Dashboard
        </h1>
        <p className="text-dashboard-text-muted text-lg mb-2">
          Principle Auto Group
        </p>
        <div className="mt-8 inline-flex gap-4">
          <span className="px-4 py-2 rounded-lg bg-toyota/20 text-toyota border border-toyota/30">
            Toyota of Hernando
          </span>
          <span className="px-4 py-2 rounded-lg bg-infiniti/20 text-infiniti border border-infiniti/30">
            INFINITI of Boerne
          </span>
        </div>
        <p className="text-dashboard-text-muted mt-8 text-sm">
          Authentication verified. Dashboard coming in Sprint 2.
        </p>
      </div>
    </div>
  );
}

export default App;
