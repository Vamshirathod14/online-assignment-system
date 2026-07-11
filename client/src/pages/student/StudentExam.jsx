import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useExamSecurity from '../../hooks/useExamSecurity';

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

  const timerRef = useRef(null);
  const fetchedRef = useRef(false);

  const handleTerminate = useCallback((reason) => {
    setTerminated(true);
    clearInterval(timerRef.current);
    setTimeout(() => {
      navigate('/student/dashboard', {
        state: { message: `Exam terminated: ${reason.replace(/_/g, ' ')}` },
      });
    }, 2000);
  }, [navigate]);

  const {
    violations,
    cameraActive,
    warning,
    enterFullscreen,
    startCamera,
    stopCamera,
    terminateExam,
  } = useExamSecurity(attemptId, handleTerminate);

  const fetchExamData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    try {
      const { data } = await api.get(`/exam/data/${attemptId}`);
      if (data.data.attempt.status === 'terminated') {
        setTerminated(true);
        setError('This exam has been terminated.');
        setLoading(false);
        return;
      }
      setExamData(data.data);
      setAnswers(data.data.answers || {});
      setTimeRemaining(data.data.timeRemaining);
      setLoading(false);
      enterFullscreen();
      startCamera();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load exam');
      setLoading(false);
    }
  }, [attemptId, enterFullscreen, startCamera]);

  useEffect(() => {
    fetchExamData();
    return () => {
      stopCamera();
    };
  }, [fetchExamData, stopCamera]);

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
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOption }));
    try {
      await api.put(`/exam/save-answer/${attemptId}`, { questionId, selectedOption });
    } catch {
      // silent fail
    }
  };

  const handleSubmit = async () => {
    if (terminated) return;
    const answeredCount = Object.keys(answers).length;
    const total = examData?.questions?.length || 0;
    const unanswered = total - answeredCount;

    let msg = 'Are you sure you want to submit?';
    if (unanswered > 0) {
      msg = `You have ${unanswered} unanswered question(s). Are you sure you want to submit?`;
    }
    if (!window.confirm(msg)) return;

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
    if (!window.confirm('Are you sure you want to terminate this exam? This action cannot be undone.')) return;
    await terminateExam('student自愿');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getQuestionStatus = (qId) => {
    if (qId === examData?.questions[currentQ]?._id) return 'current';
    if (answers[qId]) return 'answered';
    return 'not-answered';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading exam...</div>
      </div>
    );
  }

  if (error || terminated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          {terminated && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-semibold">Exam Terminated</p>
              <p className="text-red-500 text-sm mt-1">
                Your exam has been terminated due to security violations.
              </p>
            </div>
          )}
          <p className="text-red-600 mb-4">{error || 'Exam terminated'}</p>
          <button onClick={() => navigate('/student/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Back to Dashboard
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Security Warning */}
      {warning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-semibold">
          {warning}
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-gray-800">{examData.test.title}</h1>
            <p className="text-xs text-gray-500">Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-xs text-gray-500">Camera {cameraActive ? 'On' : 'Off'}</span>
            </div>
            {violations > 0 && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {violations} violation{violations !== 1 ? 's' : ''}
              </span>
            )}
            <span className="text-sm text-gray-500">{answeredCount}/{questions.length} answered</span>
            <div className={`text-lg font-mono font-bold px-4 py-1 rounded-lg ${
              timeRemaining <= 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-800'
            }`}>
              {formatTime(timeRemaining)}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || terminated}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
            <button
              onClick={handleTerminateClick}
              disabled={submitting || terminated}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              Terminate
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Main Question Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                Q{currentQ + 1} &middot; {question.marks} mark{question.marks !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-500 ml-2">{question.subject}</span>
            </div>
            <p className="text-gray-800 text-lg mb-6 leading-relaxed">{question.questionText}</p>

            <div className="space-y-3">
              {question.options.map((opt) => (
                <label
                  key={opt.label}
                  onClick={() => handleSaveAnswer(question._id, opt.label)}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                    answers[question._id] === opt.label
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    answers[question._id] === opt.label
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {opt.label}
                  </span>
                  <span className="text-gray-700">{opt.text}</span>
                </label>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentQ((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQ === questions.length - 1}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-20">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q._id);
                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentQ(idx)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition ${
                      status === 'current'
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                        : status === 'answered'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-green-500"></span>
                <span className="text-gray-600">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-gray-200"></span>
                <span className="text-gray-600">Not Answered ({questions.length - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
