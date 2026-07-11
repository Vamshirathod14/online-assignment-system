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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        setStats(data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
