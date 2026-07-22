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
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function TestCountdownCard({ test, now, onStart, onResume, startingTest }) {
  const startDate = new Date(test.startDate);
  const endDate = new Date(test.endDate);
  const isCompleted = test.studentStatus === 'completed';
  const isInProgress = test.studentStatus === 'in_progress';
  const isTerminated = test.studentStatus === 'terminated';
  const isDbActive = test.status === 'active';

  console.log(`[Countdown] ${test.title}`, {
    NOW: new Date(now).toISOString(),
    START: startDate.toISOString(),
    END: endDate.toISOString(),
    'Remaining(ms)': endDate.getTime() - now,
    Countdown: formatCountdown(endDate.getTime() - now),
    duration: test.duration,
    isDbActive,
  });

  let availabilityStatus, statusColor, statusBg, countdownLabel;

  if (!isDbActive) {
    availabilityStatus = 'Inactive';
    statusColor = 'text-gray-600';
    statusBg = 'bg-gray-50 border-gray-200';
  } else if (now < startDate) {
    availabilityStatus = 'Upcoming';
    statusColor = 'text-blue-700';
    statusBg = 'bg-blue-50 border-blue-200';
    const fc = formatCountdown(startDate.getTime() - now);
    countdownLabel = fc ? `Starts in ${fc}` : null;
  } else if (now >= startDate && now <= endDate) {
    availabilityStatus = 'Active';
    statusColor = 'text-green-700';
    statusBg = 'bg-green-50 border-green-200';
    const fc = formatCountdown(endDate.getTime() - now);
    countdownLabel = fc ? `Ends in ${fc}` : null;
  } else {
    availabilityStatus = 'Expired';
    statusColor = 'text-red-700';
    statusBg = 'bg-red-50 border-red-200';
  }

  const isActiveWindow = availabilityStatus === 'Active';
  const canStart = isDbActive && isActiveWindow && !isCompleted && !isInProgress && !isTerminated;

  return (
    <div className={`group border rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-white ${
      isCompleted ? 'border-green-200'
      : isInProgress ? 'border-amber-200'
      : isTerminated ? 'border-red-200'
      : isActiveWindow ? 'border-green-300'
      : availabilityStatus === 'Upcoming' ? 'border-blue-200'
      : 'border-gray-200'
    }`}>
      <div className="flex flex-col md:flex-row">
        {/* Left: Title, Branch, Description */}
        <div className="flex-1 min-w-0 p-5 md:p-6">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-700 transition-colors">{test.title}</h3>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusBg} ${statusColor}`}>
              {isActiveWindow && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />}
              {availabilityStatus}
            </span>
            {isCompleted && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="inline w-3 h-3 mr-0.5 -mt-0.5" /> Completed
              </span>
            )}
            {isInProgress && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                In Progress
              </span>
            )}
            {isTerminated && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                Terminated
              </span>
            )}
          </div>
          {test.branch && (
            <p className="text-sm text-gray-500 mb-1">{test.branch}</p>
          )}
          {test.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{test.description}</p>
          )}
        </div>

        {/* Center: Duration, Questions, Marks */}
        <div className="flex items-center gap-6 px-5 md:px-6 py-4 md:py-6 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50/50 md:w-56 flex-shrink-0">
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-900">{test.duration}m</span>
            <span className="text-[11px] text-gray-400">Duration</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-900">{test.totalQuestions}</span>
            <span className="text-[11px] text-gray-400">Questions</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-900">{test.totalMarks}</span>
            <span className="text-[11px] text-gray-400">Marks</span>
          </div>
        </div>

        {/* Right: Countdown, Dates, Action */}
        <div className="flex flex-col items-stretch justify-between p-5 md:p-6 md:w-64 flex-shrink-0 gap-4">
          {/* Countdown */}
          <div className="space-y-2">
            {countdownLabel && (
              <div className={`flex items-center gap-2 text-sm font-bold font-mono ${
                isActiveWindow ? 'text-green-700' : 'text-blue-700'
              }`}>
                <Timer className="w-4 h-4 flex-shrink-0" />
                <span className="tracking-wide">{countdownLabel}</span>
              </div>
            )}
            {!isDbActive && (
              <p className="text-sm text-gray-500 font-medium">Test unavailable — admin has deactivated it.</p>
            )}
            {availabilityStatus === 'Expired' && !isCompleted && (
              <p className="text-sm text-red-500 font-medium">This assessment has expired.</p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{formatDate(startDate)} — {formatDate(endDate)}</span>
            </div>
            <div className="text-xs text-gray-400">
              {formatTime(startDate)} — {formatTime(endDate)}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            {isCompleted ? (
              <button className="w-full btn bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Completed
              </button>
            ) : isInProgress ? (
              <button
                onClick={() => onResume(test._id)}
                className="w-full btn bg-amber-500 text-white hover:bg-amber-600 shadow-sm text-sm font-semibold"
              >
                <PlayCircle className="w-4 h-4" /> Resume Exam
              </button>
            ) : isTerminated ? (
              <button className="w-full btn bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-sm font-semibold cursor-not-allowed" disabled>
                <AlertTriangle className="w-4 h-4" /> Terminated
              </button>
            ) : !isDbActive ? (
              <button className="w-full btn bg-gray-50 text-gray-400 border border-gray-200 text-sm font-semibold cursor-not-allowed" disabled>
                Inactive
              </button>
            ) : (
              <button
                onClick={() => onStart(test._id)}
                disabled={!canStart || startingTest === test._id}
                className={`w-full btn text-sm font-semibold shadow-sm ${
                  canStart
                    ? 'btn-primary'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                {startingTest === test._id ? (
                  <span className="flex items-center justify-center gap-2"><span className="loading-spinner" /> Starting...</span>
                ) : (
                  <span className="flex items-center justify-center gap-1"><PlayCircle className="w-4 h-4" /> Start Exam</span>
                )}
              </button>
            )}
          </div>
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
