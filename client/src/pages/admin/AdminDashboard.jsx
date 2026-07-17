import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  ClipboardList,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingUp,
  Award,
  Shield,
  Activity,
  BookOpen,
} from 'lucide-react';

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Marks Bar */}
          <div className="section-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              Average Marks
            </h3>
            <div className="space-y-3">
              {chartData.avgMarks?.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate max-w-[200px]">{item.test || item.label || 'N/A'}</span>
                    <span className="text-gray-500 font-mono">{item.avgMarks ?? item.value ?? 0}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.avgMarks ?? item.value ?? 0, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!chartData.avgMarks || chartData.avgMarks.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Pass/Fail Ratio */}
          <div className="section-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-600" />
              Pass / Fail Ratio
            </h3>
            <div className="space-y-4">
              {chartData.passFail && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">Passed</span>
                      <span className="text-accent-600 font-mono font-semibold">{chartData.passFail.passed ?? 0}</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${((chartData.passFail.passed ?? 0) / Math.max((chartData.passFail.passed ?? 0) + (chartData.passFail.failed ?? 0), 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">Failed</span>
                      <span className="text-red-600 font-mono font-semibold">{chartData.passFail.failed ?? 0}</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${((chartData.passFail.failed ?? 0) / Math.max((chartData.passFail.passed ?? 0) + (chartData.passFail.failed ?? 0), 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
              {(!chartData.passFail) && (
                <p className="text-sm text-gray-400 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          {/* Department Performance */}
          <div className="section-card p-6 lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-600" />
              Department Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {chartData.departments?.map((dept, idx) => {
                const maxMarks = Math.max(...chartData.departments.map(d => d.avgMarks ?? d.value ?? 0), 1);
                return (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">{dept.department || dept.label || 'N/A'}</span>
                      <span className="text-xs font-mono text-gray-500">{dept.avgMarks ?? dept.value ?? 0}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${((dept.avgMarks ?? dept.value ?? 0) / maxMarks) * 100}%`,
                          backgroundColor: ['#0056D2', '#2EA8FF', '#FF7A00', '#22c55e', '#8b5cf6', '#f59e0b'][idx % 6]
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{dept.count ?? dept.total ?? 0} students</p>
                  </div>
                );
              })}
              {(!chartData.departments || chartData.departments.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4 col-span-full">No department data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
