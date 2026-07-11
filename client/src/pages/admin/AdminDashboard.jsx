import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/students/count');
        setStudentCount(data.data.count);
      } catch {
        // ignore
      }
    };
    fetchCount();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.name}</h1>
      <p className="text-gray-500 mb-6">Admin Dashboard</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">Students</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{studentCount}</p>
          <p className="text-sm text-gray-400 mt-1">Registered students</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700">Tests</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">-</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-700">Questions</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
          <h3 className="text-lg font-semibold text-gray-700">Results</h3>
          <p className="text-3xl font-bold text-amber-600 mt-2">-</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
