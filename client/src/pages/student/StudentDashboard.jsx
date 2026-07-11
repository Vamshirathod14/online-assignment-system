import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Welcome, {user?.name}!
      </h1>
      <p className="text-gray-500 mb-6">
        {user?.collegeName} &middot; {user?.branch} &middot; {user?.hallTicket}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">Available Tests</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          <p className="text-sm text-gray-400 mt-1">No tests assigned yet</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          <p className="text-sm text-gray-400 mt-1">No exams taken yet</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-700">Average Score</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">-</p>
          <p className="text-sm text-gray-400 mt-1">Results not yet published</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/student/exam"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            View Exams
          </Link>
          <Link
            to="/student/results"
            className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
          >
            View Results
          </Link>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-yellow-800 text-sm">
          Results for completed exams will be published here once reviewed by the administrator.
        </p>
      </div>
    </div>
  );
}
