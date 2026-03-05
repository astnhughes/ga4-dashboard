import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface LineChartProps {
  labels: string[];
  data: number[];
  label: string;
  color: string;
  fill?: boolean;
  height?: number;
}

export function LineChart({ labels, data, label, color, fill = true, height = 300 }: LineChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: color,
        backgroundColor: fill ? color + '20' : 'transparent',
        fill,
        tension: 0.3,
        pointRadius: 0,
        pointHitRadius: 10,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: '#1a1d27',
        borderColor: '#2a2e3d',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: '#2a2e3d40' },
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: 10,
          font: { size: 11 },
        },
      },
      y: {
        grid: { color: '#2a2e3d40' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
