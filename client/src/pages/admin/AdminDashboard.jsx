import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.name}</h1>
      <p className="text-gray-500 mb-6">Admin Dashboard</p>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-700">Students</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalStudents}</p>
              <p className="text-sm text-gray-400 mt-1">Registered students</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-700">Tests</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalTests}</p>
              <p className="text-sm text-gray-400 mt-1">{stats.activeTests} active</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-gray-700">Questions</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalQuestions}</p>
              <p className="text-sm text-gray-400 mt-1">Question bank</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
              <h3 className="text-lg font-semibold text-gray-700">Attempts</h3>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalAttempts}</p>
              <p className="text-sm text-gray-400 mt-1">{stats.completedAttempts} completed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
              <h3 className="text-lg font-semibold text-gray-700">Published</h3>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.publishedResults}</p>
              <p className="text-sm text-gray-400 mt-1">{stats.pendingResults} pending</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-gray-700">Terminated</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.terminatedAttempts}</p>
              <p className="text-sm text-gray-400 mt-1">Security violations</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
              <h3 className="text-lg font-semibold text-gray-700">Avg Score</h3>
              <p className="text-3xl font-bold text-teal-600 mt-2">{stats.averageScore}%</p>
              <p className="text-sm text-gray-400 mt-1">Across all tests</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-cyan-500">
              <h3 className="text-lg font-semibold text-gray-700">Pass Rate</h3>
              <p className="text-3xl font-bold text-cyan-600 mt-2">{stats.passPercentage}%</p>
              <p className="text-sm text-gray-400 mt-1">Overall pass percentage</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
