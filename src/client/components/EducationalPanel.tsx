import { useState } from 'react';

interface EducationalPanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function EducationalPanel({ title, children, defaultOpen = false }: EducationalPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-dashboard-card/50 rounded-lg border border-dashboard-border/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-dashboard-card-hover/30 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-infiniti">{title}</span>
        <svg
          className={`w-4 h-4 text-dashboard-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-dashboard-text-primary leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
