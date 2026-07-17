import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useExamSecurity from '../../hooks/useExamSecurity';
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Send,
  StopCircle,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';

export default function StudentExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [terminated, setTerminated] = useState(false);
  const [terminatedReason, setTerminatedReason] = useState('');
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false);

  const timerRef = useRef(null);
  const fetchedRef = useRef(false);

  const handleTerminate = useCallback((reason) => {
    setTerminated(true);
    setTerminatedReason(reason);
    clearInterval(timerRef.current);
    setSubmitting(false);
    setTimeout(() => {
      navigate('/student/results');
    }, 3000);
  }, [navigate]);

  const {
    isFullscreen,
    enterFullscreen,
  } = useExamSecurity(attemptId, handleTerminate);

  const fetchExamData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    try {
      const { data } = await api.get(`/exam/data/${attemptId}`);
      if (data.data.attempt.status === 'terminated') {
        setTerminated(true);
        setTerminatedReason('Exam was terminated');
        setLoading(false);
        return;
      }
      setExamData(data.data);
      setAnswers(data.data.answers || {});
      setTimeRemaining(data.data.timeRemaining);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load exam');
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchExamData();
  }, [fetchExamData]);

  useEffect(() => {
    if (timeRemaining <= 0 && examData && !submitting && !terminated) {
      handleAutoSubmit();
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [examData?.attempt?._id, terminated]);

  const handleAutoSubmit = async () => {
    if (submitting || terminated) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      await api.put(`/exam/submit/${attemptId}`);
      navigate('/student/dashboard', { state: { message: 'Exam submitted successfully' } });
    } catch {
      navigate('/student/dashboard');
    }
  };

  const handleSaveAnswer = async (questionId, selectedOption) => {
    if (terminated) return;
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOption }));
    try {
      await api.put(`/exam/save-answer/${attemptId}`, { questionId, selectedOption });
    } catch {
      // silent fail
    }
  };

  const handleSubmit = async () => {
    if (terminated) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      await api.put(`/exam/submit/${attemptId}`);
      navigate('/student/dashboard', { state: { message: 'Exam submitted successfully' } });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit');
      setSubmitting(false);
    }
  };

  const handleTerminateClick = async () => {
    if (terminated) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      await api.post(`/security/terminate/${attemptId}`, {
        reason: 'student_voluntary',
        violationType: 'student_voluntary',
        violationDetails: 'Student chose to end exam',
      });
    } catch {
      // proceed to termination UI regardless
    }
    setTerminated(true);
    setTerminatedReason('Student ended the exam');
    setTimeout(() => {
      navigate('/student/results');
    }, 3000);
  };

  const handleEnterFullscreen = () => {
    enterFullscreen();
    setHasEnteredFullscreen(true);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getQuestionStatus = (qId) => {
    if (qId === examData?.questions[currentQ]?._id) return 'current';
    if (answers[qId]) return 'answered';
    return 'not-answered';
  };

  const getTimerColor = () => {
    if (timeRemaining <= 60) return 'text-red-600 bg-red-50 border-red-200';
    if (timeRemaining <= 300) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error || terminated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="section-card p-8 max-w-md text-center animate-scale-in">
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-600 font-semibold">Exam Terminated</p>
            </div>
            <p className="text-red-500 text-sm mt-1">
              Your exam has been terminated because unauthorized navigation was detected.
            </p>
          </div>
          <p className="text-red-600 mb-4 font-medium">{error || 'Redirecting to results...'}</p>
          <button onClick={() => navigate('/student/results')} className="btn-primary">
            View Results
          </button>
        </div>
      </div>
    );
  }

  if (!examData || !examData.questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">No questions available</div>
      </div>
    );
  }

  const questions = examData.questions;
  const question = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pre-fullscreen banner */}
      {!hasEnteredFullscreen && (
        <div className="bg-primary-600 text-white px-4 py-3 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 flex-wrap">
            <p className="text-sm font-medium">Click below to enter fullscreen mode for the exam</p>
            <button
              onClick={handleEnterFullscreen}
              className="flex items-center gap-2 bg-white text-primary-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors"
            >
              <Maximize className="w-4 h-4" /> Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-4">
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">{examData.test.title}</h1>
              <p className="text-xs text-gray-500">Q{currentQ + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Progress */}
              <span className="hidden sm:inline text-xs text-gray-500 font-medium">{answeredCount}/{questions.length}</span>

              {/* Timer */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${getTimerColor()}`}>
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeRemaining)}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || terminated}
                className="btn-success text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{submitting ? 'Submitting...' : 'Submit'}</span>
              </button>

              {/* End Exam */}
              <button
                onClick={handleTerminateClick}
                disabled={submitting || terminated}
                className="btn-danger text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <StopCircle className="w-4 h-4" />
                <span className="hidden sm:inline">End</span>
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main Question Area */}
        <div className="flex-1 min-w-0">
          <div className="section-card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <span className="badge-info">
                Q{currentQ + 1} &middot; {question.marks} mark{question.marks !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> {question.subject}
              </span>
            </div>
            <p className="text-gray-900 text-lg mb-6 leading-relaxed font-medium">{question.questionText}</p>

            <div className="space-y-3">
              {question.options.map((opt) => {
                const isSelected = answers[question._id] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSaveAnswer(question._id, opt.label)}
                    disabled={terminated}
                    className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                      terminated
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {opt.label}
                    </span>
                    <span className={`text-sm ${isSelected ? 'text-primary-900 font-medium' : 'text-gray-700'}`}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-5 border-t border-gray-100">
              <button
                onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                disabled={currentQ === 0 || terminated}
                className="btn-secondary"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-gray-400 font-medium">
                {currentQ + 1} / {questions.length}
              </span>
              <button
                onClick={() => setCurrentQ((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQ === questions.length - 1 || terminated}
                className="btn-primary"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="section-card p-4 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q._id);
                return (
                  <button
                    key={q._id}
                    onClick={() => !terminated && setCurrentQ(idx)}
                    disabled={terminated}
                    aria-label={`Question ${idx + 1}${status === 'answered' ? ' (answered)' : ''}`}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      status === 'current'
                        ? 'bg-primary-600 text-white ring-2 ring-primary-300 shadow-sm'
                        : status === 'answered'
                        ? 'bg-accent-500 text-white hover:bg-accent-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-primary-600 ring-2 ring-primary-300" />
                <span className="text-gray-600">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-500" />
                <span className="text-gray-600">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-gray-600">Not Answered ({questions.length - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
