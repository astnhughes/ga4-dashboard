import { useState } from 'react';
import { Issue } from '@shared/types';

interface IssueCardProps {
  issue: Issue;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/30', label: 'CRITICAL' },
  high: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30', label: 'HIGH' },
  medium: { bg: 'bg-infiniti/10', text: 'text-infiniti', border: 'border-infiniti/30', label: 'MEDIUM' },
  low: { bg: 'bg-dashboard-text-muted/10', text: 'text-dashboard-text-muted', border: 'border-dashboard-border', label: 'LOW' },
};

export function IssueCard({ issue }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.low;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label={`${style.label} issue: ${issue.title}. Press to ${expanded ? 'collapse' : 'expand'} details.`}
      className={`rounded-xl border ${style.border} ${style.bg} p-4 cursor-pointer transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-infiniti/50`}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold ${style.text} uppercase tracking-wide`} aria-label={`Severity: ${style.label}`}>
              {style.label}
            </span>
            <span className="text-xs text-dashboard-text-muted capitalize">
              {issue.category}
            </span>
          </div>
          <h3 className="text-sm font-medium text-dashboard-text-primary">
            {issue.title}
          </h3>
        </div>
        <span className="text-dashboard-text-muted text-xs mt-1 flex-shrink-0" aria-hidden="true">
          {expanded ? 'Hide' : 'Details'}
        </span>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-dashboard-border pt-3">
          <div>
            <h4 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wide mb-1">
              What This Means
            </h4>
            <p className="text-sm text-dashboard-text-primary leading-relaxed">
              {issue.whatThisMeans}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wide mb-1">
              How To Fix
            </h4>
            <div className="text-sm text-dashboard-text-primary leading-relaxed whitespace-pre-line">
              {issue.howToFix}
            </div>
          </div>
          {issue.metric && (
            <div className="flex gap-4 text-xs text-dashboard-text-muted">
              <span>Metric: {issue.metric}</span>
              {issue.value !== undefined && <span>Value: {typeof issue.value === 'number' && issue.value < 1 ? (issue.value * 100).toFixed(1) + '%' : issue.value}</span>}
              {issue.benchmark !== undefined && <span>Benchmark: {typeof issue.benchmark === 'number' && issue.benchmark < 1 ? (issue.benchmark * 100).toFixed(1) + '%' : issue.benchmark}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
