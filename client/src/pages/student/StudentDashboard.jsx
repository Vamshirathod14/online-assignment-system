import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingTest, setStartingTest] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, historyRes] = await Promise.all([
          api.get('/exam/available-tests'),
          api.get('/results/exam-history'),
        ]);
        setTests(testsRes.data.data);
        setHistory(historyRes.data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartExam = async (testId) => {
    if (!window.confirm('Are you sure you want to start this exam? The timer will begin immediately.')) return;
    setStartingTest(testId);
    try {
      const { data } = await api.post('/exam/start', { testId });
      navigate(`/student/exam/${data.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start exam');
    } finally {
      setStartingTest(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Completed</span>;
    if (status === 'in_progress') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">In Progress</span>;
    if (status === 'terminated') return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Terminated</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Not Started</span>;
  };

  const isTestActive = (test) => {
    const now = new Date();
    return test.status === 'active' && now >= new Date(test.startDate) && now <= new Date(test.endDate);
  };

  const completedCount = tests.filter((t) => t.studentStatus === 'completed').length;
  const inProgressCount = tests.filter((t) => t.studentStatus === 'in_progress').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome, {user?.name}!</h1>
      <p className="text-gray-500 mb-6">{user?.collegeName} &middot; {user?.branch} &middot; {user?.hallTicket}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">Available Tests</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{tests.length}</p>
          <p className="text-sm text-gray-400 mt-1">Active tests</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{completedCount}</p>
          <p className="text-sm text-gray-400 mt-1">Exams taken</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-700">In Progress</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{inProgressCount}</p>
          <p className="text-sm text-gray-400 mt-1">Ongoing exams</p>
        </div>
      </div>

      {/* Available Tests */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Available Tests</h2>
        {tests.length === 0 ? (
          <p className="text-gray-500">No active tests available at the moment.</p>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test._id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{test.title}</h3>
                      {getStatusBadge(test.studentStatus)}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{test.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>Duration: {test.duration} min</span>
                      <span>Questions: {test.totalQuestions}</span>
                      <span>Marks: {test.totalMarks}</span>
                      <span>Pass: {test.passingMarks}</span>
                      <span>Branch: {test.branch}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(test.startDate).toLocaleString()} - {new Date(test.endDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    {test.studentStatus === 'completed' ? (
                      <span className="text-sm text-green-600 font-semibold">Completed</span>
                    ) : test.studentStatus === 'in_progress' ? (
                      <button
                        onClick={() => navigate(`/student/exam/${test._id}`)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition"
                      >
                        Resume
                      </button>
                    ) : test.studentStatus === 'terminated' ? (
                      <span className="text-sm text-red-600 font-semibold">Terminated</span>
                    ) : (
                      <button
                        onClick={() => handleStartExam(test._id)}
                        disabled={!isTestActive(test) || startingTest === test._id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {startingTest === test._id ? 'Starting...' : 'Start Exam'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Results</h2>
          <div className="space-y-3">
            {history.slice(0, 5).map((h) => (
              <div key={h._id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">{h.test?.title}</h4>
                  <p className="text-xs text-gray-500">
                    {h.startTime ? new Date(h.startTime).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{h.obtainedMarks}/{h.totalMarks}</div>
                  <span className={`text-xs font-semibold ${h.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {h.isPassed ? 'Pass' : 'Fail'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm">
            Results for completed exams will be published here once reviewed by the administrator.
          </p>
        </div>
      )}
    </div>
  );
}
