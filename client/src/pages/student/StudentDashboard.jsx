import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  Timer,
} from 'lucide-react';

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) {
    return { label: `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`, large: true };
  }
  return { label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`, large: false };
}

function TestCountdownCard({ test, now, onStart, onResume, startingTest }) {
  const startDate = new Date(test.startDate);
  const endDate = new Date(test.endDate);
  const isCompleted = test.studentStatus === 'completed';
  const isInProgress = test.studentStatus === 'in_progress';
  const isTerminated = test.studentStatus === 'terminated';

  let status, statusColor, statusBg, countdownMs, countdownLabel;

  if (isCompleted) {
    status = 'Completed';
    statusColor = 'text-accent-700';
    statusBg = 'bg-accent-50 border-accent-200';
  } else if (isInProgress) {
    status = 'In Progress';
    statusColor = 'text-amber-700';
    statusBg = 'bg-amber-50 border-amber-200';
  } else if (isTerminated) {
    status = 'Terminated';
    statusColor = 'text-red-700';
    statusBg = 'bg-red-50 border-red-200';
  } else if (now < startDate) {
    status = 'Upcoming';
    statusColor = 'text-amber-700';
    statusBg = 'bg-amber-50 border-amber-200';
    countdownMs = startDate.getTime() - now;
    const fc = formatCountdown(countdownMs);
    countdownLabel = fc ? `Starts in ${fc.label}` : null;
  } else if (now >= startDate && now <= endDate && test.status === 'active') {
    status = 'Live Now';
    statusColor = 'text-accent-700';
    statusBg = 'bg-accent-50 border-accent-200';
    countdownMs = endDate.getTime() - now;
    const fc = formatCountdown(countdownMs);
    countdownLabel = fc ? `Ends in ${fc.label}` : null;
  } else {
    status = 'Ended';
    statusColor = 'text-red-700';
    statusBg = 'bg-red-50 border-red-200';
  }

  const canStart = test.status === 'active' && now >= startDate && now <= endDate && !isCompleted && !isInProgress && !isTerminated;
  const isEnded = now > endDate;
  const isUpcoming = now < startDate;

  const cardBorder = isCompleted
    ? 'border-accent-200'
    : isInProgress
      ? 'border-amber-200'
      : isTerminated || isEnded
        ? 'border-red-200'
        : canStart
          ? 'border-accent-300'
          : 'border-amber-200';

  return (
    <div className={`border ${cardBorder} rounded-2xl p-5 transition-all duration-300 hover:shadow-md ${
      canStart ? 'bg-gradient-to-br from-accent-50/50 to-white' : 'bg-white'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-lg">{test.title}</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBg} ${statusColor}`}>
              {status === 'Live Now' && <span className="inline-block w-1.5 h-1.5 bg-accent-500 rounded-full mr-1.5 animate-pulse" />}
              {status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              {test.duration} min
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-gray-400" />
              {test.totalQuestions} Qs
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-gray-400" />
              {test.totalMarks} marks
            </span>
          </div>

          {/* Countdown */}
          {countdownLabel && (
            <div className={`flex items-center gap-2 text-sm font-semibold ${
              canStart ? 'text-accent-700' : 'text-amber-700'
            }`}>
              <Timer className="w-4 h-4" />
              <span className="font-mono tracking-wide">{countdownLabel}</span>
            </div>
          )}
          {isEnded && !isCompleted && (
            <p className="text-sm text-red-500 font-medium">This assessment is no longer available.</p>
          )}
        </div>

        <div className="flex-shrink-0">
          {isCompleted ? (
            <span className="flex items-center gap-1.5 text-sm text-accent-600 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </span>
          ) : isInProgress ? (
            <button
              onClick={() => onResume(test._id)}
              className="btn bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
            >
              <PlayCircle className="w-4 h-4" /> Resume
            </button>
          ) : isTerminated ? (
            <span className="flex items-center gap-1.5 text-sm text-red-600 font-semibold">
              <AlertTriangle className="w-4 h-4" /> Terminated
            </span>
          ) : (
            <button
              onClick={() => onStart(test._id)}
              disabled={!canStart || startingTest === test._id}
              className={`btn shadow-sm ${
                canStart
                  ? 'btn-primary'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
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
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingTest, setStartingTest] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const handleStartExam = useCallback(async (testId) => {
    if (!window.confirm('Are you sure you want to start this exam? The timer will begin immediately.')) return;
    setStartingTest(testId);
    try {
      const { data } = await api.post('/exam/start', { testId });
      navigate(`/student/exam/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start exam');
    } finally {
      setStartingTest(null);
    }
  }, [navigate]);

  const completedCount = tests.filter((t) => t.studentStatus === 'completed').length;
  const inProgressCount = tests.filter((t) => t.studentStatus === 'in_progress').length;

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

      <div className="section-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Tests</h2>
        {tests.length === 0 ? (
          <div className="empty-state py-12">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No active tests available</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <TestCountdownCard
                key={test._id}
                test={test}
                now={now}
                onStart={handleStartExam}
                onResume={(attemptId) => navigate(`/student/exam/${attemptId}`)}
                startingTest={startingTest}
              />
            ))}
          </div>
        )}
      </div>

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
