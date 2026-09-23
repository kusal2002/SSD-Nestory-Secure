import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { ReadingActivityDayRow } from "../../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface ReadingWeeklyBarChartProps {
  byDay?: ReadingActivityDayRow[];
  title?: string;
  color?: string;
  isParent?: boolean;
}

const ReadingWeeklyBarChart: React.FC<ReadingWeeklyBarChartProps> = ({ 
  byDay = [], 
  title = "Reading Activity", 
  color = "#f43f5e",
  isParent = false
}) => {
  const shortLabel = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  const labels = useMemo(() => byDay?.map((row) => shortLabel(row.date)) || [], [byDay]);
  const dataPoints = useMemo(() => byDay?.map((row) => row.minutesSpent) || [], [byDay]);

  const barColor = isParent ? "#6366f1" : color;
  const barHoverColor = isParent ? "#4f46e5" : "#e11d48";

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Minutes Spent",
        data: dataPoints,
        backgroundColor: barColor,
        borderColor: barColor,
        borderRadius: 20,
        borderSkipped: false,
        barThickness: 24,
        hoverBackgroundColor: barHoverColor,
      },
    ],
  }), [labels, dataPoints, barColor, barHoverColor]);

  const options: ChartOptions<"bar"> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "x" as const,
    layout: {
      padding: {
        top: 20,
        bottom: 10,
        left: 10,
        right: 10
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#1f2937",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
          family: "Inter, sans-serif"
        } as any,
        bodyFont: {
          size: 13,
          family: "Inter, sans-serif"
        } as any,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => ` 📖 ${context.raw} minutes reading`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: dataPoints.length > 0 ? Math.max(...dataPoints) * 1.2 : 100,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.04)",
          lineWidth: 1,
        },
        border: {
          display: false,
        } as any,
        ticks: {
          padding: 10,
          font: {
            family: "Inter, sans-serif",
            weight: "700",
            size: 11,
          } as any,
          color: "#9ca3af",
        }
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        } as any,
        ticks: {
          padding: 10,
          font: {
            family: "Inter, sans-serif",
            weight: "800",
            size: 12,
          } as any,
          color: "#4b5563",
        }
      }
    },
    animation: {
      duration: 2000,
      easing: "easeOutQuart"
    } as any
  }), [dataPoints]);

  if (!byDay || byDay.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
           📊
        </div>
        <p className="font-black uppercase text-[10px] tracking-widest text-gray-400">Not enough data yet 🔍</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <Bar key={`chart-${byDay.length}-${isParent}`} options={options} data={data} />
    </div>
  );
};

export default ReadingWeeklyBarChart;
