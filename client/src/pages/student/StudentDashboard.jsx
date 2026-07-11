import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  Calendar,
  Target,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

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
    if (status === 'completed') return <span className="badge-success">Completed</span>;
    if (status === 'in_progress') return <span className="badge-warning">In Progress</span>;
    if (status === 'terminated') return <span className="badge-danger">Terminated</span>;
    return <span className="badge-neutral">Not Started</span>;
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center text-lg font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
            <p className="text-sm text-gray-500">
              {user?.collegeName} &middot; {user?.branch} &middot; {user?.hallTicket}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
              <p className="text-xs text-gray-500">Available Tests</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-accent-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Tests */}
      <div className="section-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Tests</h2>
        {tests.length === 0 ? (
          <div className="empty-state py-12">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No active tests available</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test._id} className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{test.title}</h3>
                      {getStatusBadge(test.studentStatus)}
                    </div>
                    {test.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">{test.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {test.duration} min</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {test.totalQuestions} questions</span>
                      <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {test.totalMarks} marks</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(test.startDate).toLocaleDateString()} - {new Date(test.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {test.studentStatus === 'completed' ? (
                      <span className="flex items-center gap-1.5 text-sm text-accent-600 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    ) : test.studentStatus === 'in_progress' ? (
                      <button
                        onClick={() => navigate(`/student/exam/${test._id}`)}
                        className="btn btn-amber-500 bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                      >
                        <PlayCircle className="w-4 h-4" /> Resume
                      </button>
                    ) : test.studentStatus === 'terminated' ? (
                      <span className="flex items-center gap-1.5 text-sm text-red-600 font-semibold">
                        <AlertTriangle className="w-4 h-4" /> Terminated
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStartExam(test._id)}
                        disabled={!isTestActive(test) || startingTest === test._id}
                        className="btn-primary"
                      >
                        {startingTest === test._id ? (
                          <span className="flex items-center gap-2"><span className="loading-spinner" /> Starting...</span>
                        ) : (
                          <span className="flex items-center gap-1"><PlayCircle className="w-4 h-4" /> Start Exam</span>
                        )}
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
        <div className="section-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Results</h2>
            <Link to="/student/results" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <div key={h._id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${h.isPassed ? 'bg-accent-50' : 'bg-red-50'}`}>
                    {h.isPassed ? <CheckCircle2 className="w-4.5 h-4.5 text-accent-600" /> : <AlertTriangle className="w-4.5 h-4.5 text-red-600" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{h.test?.title}</h4>
                    <p className="text-xs text-gray-500">
                      {h.startTime ? new Date(h.startTime).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{h.obtainedMarks}/{h.totalMarks}</div>
                  <span className={`text-xs font-semibold ${h.isPassed ? 'text-accent-600' : 'text-red-600'}`}>
                    {h.percentage}% &middot; {h.isPassed ? 'Pass' : 'Fail'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            Results for completed exams will be published here once reviewed by the administrator.
          </p>
        </div>
      )}
    </div>
  );
}
