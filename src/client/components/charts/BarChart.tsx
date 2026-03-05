import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarDataset {
  label: string;
  data: number[];
  color: string;
}

interface BarChartProps {
  labels: string[];
  datasets: BarDataset[];
  horizontal?: boolean;
  height?: number;
  stacked?: boolean;
  formatValue?: (value: number | string) => string;
}

export function BarChart({
  labels,
  datasets,
  horizontal = false,
  height = 300,
  stacked = false,
  formatValue,
}: BarChartProps) {
  const chartData = {
    labels,
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.color + 'cc',
      borderColor: ds.color,
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 0.7,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: 'top' as const,
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
        callbacks: formatValue
          ? { label: (ctx: any) => ` ${ctx.dataset.label}: ${formatValue(ctx.raw)}` }
          : undefined,
      },
    },
    scales: {
      x: {
        stacked,
        grid: { color: '#2a2e3d40' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          ...(formatValue && !horizontal ? { callback: formatValue } : {}),
        },
      },
      y: {
        stacked,
        grid: { color: '#2a2e3d40' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          ...(formatValue && horizontal ? { callback: formatValue } : {}),
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
