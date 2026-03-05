import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors: string[];
  height?: number;
  centerLabel?: string;
}

const FALLBACK_COLORS = [
  '#6366f1', '#dc2626', '#22c55e', '#eab308', '#3b82f6',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4',
];

export function DoughnutChart({ labels, data, colors, height = 250, centerLabel }: DoughnutChartProps) {
  const chartColors = colors.length >= labels.length
    ? colors
    : labels.map((_, i) => FALLBACK_COLORS[i % FALLBACK_COLORS.length]);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: chartColors.map((c) => c + 'cc'),
        borderColor: chartColors,
        borderWidth: 1,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          padding: 12,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#1a1d27',
        borderColor: '#2a2e3d',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 10,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0';
            return ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Doughnut data={chartData} options={options} />
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: 40 }}>
          <span className="text-xs text-dashboard-text-muted">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}
