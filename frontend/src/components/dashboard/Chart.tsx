import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Chart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  data: any; // Możesz rozszerzyć typ, np. zgodnie z dokumentacją Chart.js
  title?: string;
  height?: number;
}

const Chart: React.FC<ChartProps> = ({ data, title, height = 300 }: ChartProps) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      title: title
        ? {
            display: true,
            text: title,
            font: {
              size: 16,
            },
          }
        : undefined,
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        usePointStyle: true,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          borderDash: [2],
        },
      },
    },
  } as any; // Jeśli dalej pojawiają się błędy typowania opcji, rzutujemy na any

  return (
    <div className="chart-wrapper" style={{ height }}>
      <Line options={options} data={data} />
    </div>
  );
};

export default Chart;
