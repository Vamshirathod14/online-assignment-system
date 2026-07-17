import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  ClipboardList,
  HelpCircle,
  Target,
  TrendingUp,
  Award,
  Shield,
  Activity,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

const statCards = [
  { key: 'totalStudents', label: 'Students', subKey: null, icon: Users, color: 'primary' },
  { key: 'totalTests', label: 'Tests', subKey: 'activeTests', subLabel: 'active', icon: ClipboardList, color: 'accent' },
  { key: 'totalQuestions', label: 'Questions', subKey: null, subLabel: 'in bank', icon: HelpCircle, color: 'violet' },
  { key: 'totalAttempts', label: 'Attempts', subKey: 'completedAttempts', subLabel: 'completed', icon: Activity, color: 'amber' },
  { key: 'publishedResults', label: 'Published', subKey: 'pendingResults', subLabel: 'pending', icon: Award, color: 'teal' },
  { key: 'terminatedAttempts', label: 'Terminated', subKey: null, subLabel: 'violations', icon: Shield, color: 'red' },
  { key: 'averageScore', label: 'Avg Score', subKey: null, subLabel: 'across tests', icon: TrendingUp, color: 'cyan', suffix: '%' },
  { key: 'passPercentage', label: 'Pass Rate', subKey: null, subLabel: 'overall', icon: Target, color: 'indigo', suffix: '%' },
];

const colorMap = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-600', border: 'border-l-primary-500' },
  accent: { bg: 'bg-accent-50', icon: 'text-accent-600', border: 'border-l-accent-500' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-l-violet-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-l-amber-500' },
  teal: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-l-teal-500' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-l-red-500' },
  cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-l-cyan-500' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-l-indigo-500' },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.allSettled([
          api.get('/analytics/dashboard'),
          api.get('/analytics/charts'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
        if (chartsRes.status === 'fulfilled') setChartData(chartsRes.value.data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            const colors = colorMap[card.color];
            return (
              <div
                key={card.key}
                className={`stat-card border-l-4 ${colors.border} animate-fade-in-up`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats[card.key]}{card.suffix || ''}
                    </p>
                    {card.subKey && stats[card.subKey] !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">{stats[card.subKey]} {card.subLabel}</p>
                    )}
                    {!card.subKey && card.subLabel && (
                      <p className="text-xs text-gray-500 mt-1">{card.subLabel}</p>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Section */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Department Performance - Bar Chart */}
          <div className="section-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Department Performance</h3>
            {chartData.departments && chartData.departments.length > 0 ? (
              <Bar
                data={{
                  labels: chartData.departments.map(d => d.department || d._id || 'N/A'),
                  datasets: [{
                    label: 'Average Score %',
                    data: chartData.departments.map(d => d.avgMarks ?? d.value ?? 0),
                    backgroundColor: ['#0056D2', '#2EA8FF', '#FF7A00', '#22c55e', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'],
                    borderRadius: 6,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, max: 100 } }
                }}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            )}
          </div>

          {/* Pass / Fail - Pie Chart */}
          <div className="section-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Pass / Fail Distribution</h3>
            {chartData.passFail && (chartData.passFail.passed > 0 || chartData.passFail.failed > 0) ? (
              <div className="flex items-center justify-center">
                <Pie
                  data={{
                    labels: ['Passed', 'Failed'],
                    datasets: [{
                      data: [chartData.passFail.passed || 0, chartData.passFail.failed || 0],
                      backgroundColor: ['#22c55e', '#ef4444'],
                      borderWidth: 0,
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            )}
          </div>

          {/* Daily Attempts - Line Chart */}
          <div className="section-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Daily Attempts (30 days)</h3>
            {chartData.dailyAttempts && chartData.dailyAttempts.length > 0 ? (
              <Line
                data={{
                  labels: chartData.dailyAttempts.map(d => d._id),
                  datasets: [{
                    label: 'Attempts',
                    data: chartData.dailyAttempts.map(d => d.count),
                    borderColor: '#0056D2',
                    backgroundColor: 'rgba(0,86,210,0.1)',
                    fill: true,
                    tension: 0.3,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            )}
          </div>

          {/* Difficulty Distribution - Doughnut */}
          <div className="section-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Question Types</h3>
            {chartData.completedVsTerminated && chartData.completedVsTerminated.length > 0 ? (
              <div className="flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: chartData.completedVsTerminated.map(d => {
                      const labels = { completed: 'Completed', timed_out: 'Timed Out', terminated: 'Terminated', in_progress: 'In Progress' };
                      return labels[d._id] || d._id;
                    }),
                    datasets: [{
                      data: chartData.completedVsTerminated.map(d => d.count),
                      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'],
                      borderWidth: 0,
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
