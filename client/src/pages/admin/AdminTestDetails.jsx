import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  ArrowLeft, Clock, Calendar, Target, Users, HelpCircle,
  BarChart3, CheckCircle2, AlertTriangle, Trash2, Pencil, Copy,
  Eye, EyeOff, BookOpen
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminTestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await api.get(`/tests/${id}/stats`);
        setData(res.data);
      } catch {
        toast.error('Failed to load test details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this test? This cannot be undone.')) return;
    try {
      await api.delete(`/tests/${id}`);
      toast.success('Test deleted');
      navigate('/admin/tests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleStatus = async () => {
    try {
      await api.put(`/tests/${id}/toggle-status`);
      setData(prev => ({
        ...prev,
        test: { ...prev.test, status: prev.test.status === 'active' ? 'inactive' : 'active' }
      }));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handlePublish = async () => {
    try {
      await api.put(`/results/publish/${id}`);
      toast.success('Results published');
    } catch {
      toast.error('Failed to publish');
    }
  };

  const handleDuplicate = async () => {
    try {
      const { data: test } = await api.get(`/tests/${id}`);
      const t = test.data;
      await api.post('/tests', {
        title: t.title + ' (Copy)',
        description: t.description,
        branch: t.branch,
        duration: t.duration,
        totalQuestions: t.totalQuestions,
        passingMarks: t.passingMarks,
        startDate: t.startDate,
        endDate: t.endDate,
        status: 'inactive',
      });
      toast.success('Test duplicated');
      navigate('/admin/tests');
    } catch {
      toast.error('Failed to duplicate test');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Test not found</p>
        <button onClick={() => navigate('/admin/tests')} className="btn-primary mt-4">Back to Tests</button>
      </div>
    );
  }

  const { test, assignedStudents, stats } = data;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/tests')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
          <p className="text-sm text-gray-500">{test.branch} &middot; {test.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDuplicate} className="btn-secondary text-sm"><Copy className="w-4 h-4" /> Duplicate</button>
          <button onClick={() => navigate(`/admin/tests`)} className="btn-secondary text-sm"><Pencil className="w-4 h-4" /> Edit</button>
          <button onClick={handleToggleStatus} className={`btn text-sm ${test.status === 'active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'btn-primary'}`}>
            {test.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={handlePublish} className="btn-primary text-sm"><Eye className="w-4 h-4" /> Publish Results</button>
          <button onClick={handleDelete} className="btn-danger text-sm"><Trash2 className="w-4 h-4" /> Delete</button>
        </div>
      </div>

      {/* Test Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-4 border-l-primary-500">
          <Clock className="w-5 h-5 text-primary-600 mb-1" />
          <p className="text-xl font-bold text-gray-900">{test.duration} min</p>
          <p className="text-xs text-gray-500">Duration</p>
        </div>
        <div className="stat-card border-l-4 border-l-accent-500">
          <HelpCircle className="w-5 h-5 text-accent-600 mb-1" />
          <p className="text-xl font-bold text-gray-900">{test.assignedQuestions?.length || 0} / {test.totalQuestions}</p>
          <p className="text-xs text-gray-500">Questions</p>
        </div>
        <div className="stat-card border-l-4 border-l-violet-500">
          <Target className="w-5 h-5 text-violet-600 mb-1" />
          <p className="text-xl font-bold text-gray-900">{test.totalMarks}</p>
          <p className="text-xs text-gray-500">Total Marks (Pass: {test.passingMarks})</p>
        </div>
        <div className="stat-card border-l-4 border-l-teal-500">
          <Users className="w-5 h-5 text-teal-600 mb-1" />
          <p className="text-xl font-bold text-gray-900">{assignedStudents?.length || 0}</p>
          <p className="text-xs text-gray-500">Students Attempted</p>
        </div>
      </div>

      {/* Date & Status */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-6 text-sm">
          <div><span className="text-gray-500">Start:</span> <span className="font-medium text-gray-900">{new Date(test.startDate).toLocaleString()}</span></div>
          <div><span className="text-gray-500">End:</span> <span className="font-medium text-gray-900">{new Date(test.endDate).toLocaleString()}</span></div>
          <div><span className="text-gray-500">Status:</span> <span className={`font-semibold ${test.status === 'active' ? 'text-accent-600' : 'text-gray-600'}`}>{test.status}</span></div>
          <div><span className="text-gray-500">Created by:</span> <span className="font-medium text-gray-900">{test.createdBy?.name}</span></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-lg font-bold text-gray-900">{stats.totalAttempts}</p>
          <p className="text-xs text-gray-500">Attempts</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-lg font-bold text-accent-600">{stats.passCount}</p>
          <p className="text-xs text-gray-500">Passed</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-lg font-bold text-red-600">{stats.failCount}</p>
          <p className="text-xs text-gray-500">Failed</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-lg font-bold text-primary-600">{stats.averageScore}%</p>
          <p className="text-xs text-gray-500">Average</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-lg font-bold text-accent-600">{stats.highestScore}%</p>
          <p className="text-xs text-gray-500">Highest</p>
        </div>
      </div>

      {/* Assigned Questions */}
      {test.assignedQuestions && test.assignedQuestions.length > 0 && (
        <div className="section-card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600" />
            Assigned Questions ({test.assignedQuestions.length})
          </h2>
          <div className="space-y-2">
            {test.assignedQuestions.map((q, idx) => (
              <div key={q._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{q.questionText}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{q.subject}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {q.difficulty}
                    </span>
                    <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students who attempted */}
      {assignedStudents && assignedStudents.length > 0 && (
        <div className="section-card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-600" />
              Students Who Attempted ({assignedStudents.length})
            </h2>
          </div>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">#</th>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Hall Ticket</th>
                  <th className="table-header-cell">College</th>
                  <th className="table-header-cell">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignedStudents.map((s, idx) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-500">{idx + 1}</td>
                    <td className="table-cell font-medium text-gray-900">{s.name}</td>
                    <td className="table-cell font-mono text-xs text-gray-600">{s.hallTicket}</td>
                    <td className="table-cell text-gray-600">{s.collegeName}</td>
                    <td className="table-cell text-gray-600">{s.branch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
