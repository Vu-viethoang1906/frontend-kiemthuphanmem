import React, { useEffect, useState } from "react";
// 💡 Thêm Pie để giữ nguyên chức năng cũ
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
// 💡 Giữ nguyên useNavigate/useParams để component độc lập
import { useParams } from "react-router-dom";
import { fetchTasksByBoard } from "../../api/taskApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TaskChartData {
  date: string;
  doneCount: number;
  avgEstimate: number;
}

interface LineChartResponse {
  totalTask: number;
  data: TaskChartData[];
}

interface TaskChartsProps {
  boardId?: string;
}

// 💡 Tên component cũ là LineChartComponent, tôi đổi thành TaskCharts
const TaskCharts: React.FC<TaskChartsProps> = ({ boardId: propBoardId }) => {
  const { id: paramBoardId } = useParams<{ id: string }>();
  const boardId = propBoardId || paramBoardId;
  const [chartData, setChartData] = useState<LineChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!boardId) return;

    const fetchData = async () => {
      try {
        // Fetch all tasks from board
        const tasksRes = await fetchTasksByBoard(boardId);
        let tasks: any[] = [];
        
        if (Array.isArray(tasksRes)) {
          tasks = tasksRes;
        } else if (tasksRes?.success && Array.isArray(tasksRes?.data)) {
          tasks = tasksRes.data;
        } else if (Array.isArray(tasksRes?.data)) {
          tasks = tasksRes.data;
        }
        
        setAllTasks(tasks);
        
        // Calculate done count using same logic as Reports.tsx
        const isTaskCompleted = (task: any) => {
          if (!task.column_id) return false;
          // Ưu tiên check isDone flag
          if (task.column_id.isDone === true) return true;
          // Fallback check tên column
          const columnName = task.column_id?.name || "";
          return (
            columnName.toLowerCase().includes("done") ||
            columnName.toLowerCase().includes("hoàn thành")
          );
        };
        
        const doneCount = tasks.filter(isTaskCompleted).length;
        const totalTask = tasks.length;
        
        // Calculate average estimate hours
        const tasksWithEstimate = tasks.filter(t => t.estimate_hours && t.estimate_hours > 0);
        const avgEstimate = tasksWithEstimate.length > 0
          ? tasksWithEstimate.reduce((sum, t) => sum + (t.estimate_hours || 0), 0) / tasksWithEstimate.length
          : 0;
        
        // Set chart data with current date
        const today = new Date().toISOString().split('T')[0];
        setChartData({
          totalTask,
          data: [{
            date: today,
            doneCount,
            avgEstimate: Math.round(avgEstimate * 10) / 10
          }]
        });
      } catch (err) {
        console.error("Error fetching tasks data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [boardId]);

  if (loading) return <div>Loading data...</div>;
  if (!chartData || chartData.data.length === 0)
    return <div>No task data to display.</div>;

  // Chuẩn bị data cho Chart.js
  const labels = chartData.data.map((item) => item.date);
  const doneCounts = chartData.data.map((item) => item.doneCount);
  const avgEstimates = chartData.data.map((item) => item.avgEstimate);

  const lineData = {
    labels,
    datasets: [
      {
        label: "Tasks done",
        data: doneCounts,
        borderColor: "blue",
        backgroundColor: "rgba(0,0,255,0.2)",
      },
      {
        label: "Average estimate (hours)",
        data: avgEstimates,
        borderColor: "green",
        backgroundColor: "rgba(0,255,0,0.2)",
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 12, right: 16, bottom: 16, left: 16 },
    },
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Tasks Over Time" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  // ----- Pie Chart Data (giữ nguyên) -----
  const totalDone = chartData.data.reduce(
    (sum, item) => sum + item.doneCount,
    0
  );
  const totalTask = chartData.totalTask;
  const totalUndone = Math.max(0, totalTask - totalDone); // Đảm bảo không âm

  const pieData = {
    labels: ["Tasks Completed", "Tasks Not Completed"],
    datasets: [
      {
        data: [totalDone, totalUndone],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EBAA", "#FF6384AA"],
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 12, right: 16, bottom: 16, left: 16 },
    },
    plugins: {
      legend: { position: "right" as const },
      title: { display: true, text: "Completed vs Incomplete Tasks" },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const dataArr = (context.dataset?.data || []) as number[];
            const total = dataArr.reduce((a: number, b: number) => a + b, 0);
            const value = dataArr[context.dataIndex] || 0;
            const pct = total ? ((value / total) * 100) : 0;
            const label = context.label || "";
            return `${label}: ${value} (${pct.toFixed(1)}%)`;
          },
        },
      },
    },
  } as const;

  return (
    <div className="p-5 bg-white rounded-lg">
      {/* Header */}
      <div className="mb-5">
        <h2 className="m-0">Task Statistics</h2>
      </div>

      {/* 50/50 layout for Line and Pie charts with clearer separation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Line Chart Card */}
        <div className="h-[420px] w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-6 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-gray-700">Tasks Over Time</div>
          <div className="h-[360px] px-2">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Pie Chart Card */}
        <div className="h-[420px] w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-6 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-gray-700">Completed vs Incomplete Tasks</div>
          <div className="h-[360px] px-2">
            <Pie data={pieData} options={pieOptions as any} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCharts; // 💡 Export TaskCharts
