import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Search, Download, Eye, EyeOff, CheckCircle2, X, AlertTriangle,
  RefreshCw, BarChart3, ChevronLeft, Code
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminResults() {
  const navigate = useNavigate();
  const [testStats, setTestStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchTestStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/results/test-wise');
      setTestStats(data.data);
    } catch {
      toast.error('Failed to load test statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTestResults = useCallback(async (testId) => {
    setResultsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('testId', testId);
      if (search) params.append('search', search);
      if (statusFilter) params.append('isPassed', statusFilter);
      const { data } = await api.get(`/results?${params.toString()}`);
      setResults(data.data);
    } catch {
      toast.error('Failed to load results');
    } finally {
      setResultsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchTestStats(); }, [fetchTestStats]);
  useEffect(() => { if (selectedTest) fetchTestResults(selectedTest); }, [selectedTest, fetchTestResults]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleExport = async () => {
    if (!selectedTest) return;
    try {
      const params = new URLSearchParams();
      params.append('testId', selectedTest);
      if (search) params.append('search', search);
      if (statusFilter) params.append('isPassed', statusFilter);
      const response = await api.get(`/results/export-csv?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'results.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Results exported');
    } catch {
      toast.error('Failed to export results');
    }
  };

  const handleResetExam = async (attemptId) => {
    if (!window.confirm('Reset this exam? The student can retake it.')) return;
    try {
      await api.post(`/security/reset-exam/${attemptId}`);
      setSuccessMessage('Exam reset successfully');
      fetchTestResults(selectedTest);
      fetchTestStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset exam');
    }
  };

  const handlePublish = async (testId) => {
    try {
      await api.put(`/results/publish/${testId}`);
      setSuccessMessage('Results published');
      fetchTestResults(selectedTest);
    } catch {
      toast.error('Failed to publish results');
    }
  };

  const handleUnpublish = async (testId) => {
    try {
      await api.put(`/results/unpublish/${testId}`);
      setSuccessMessage('Results unpublished');
      fetchTestResults(selectedTest);
    } catch {
      toast.error('Failed to unpublish results');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="badge-success">Completed</span>;
      case 'in_progress': return <span className="badge-info">In Progress</span>;
      case 'timed_out': return <span className="badge-warning">Timed Out</span>;
      case 'terminated': return <span className="badge-danger">Terminated</span>;
      case 'reset': return <span className="badge-warning">Reset</span>;
      default: return <span className="badge-neutral">{status || 'N/A'}</span>;
    }
  };

  const getScoreColor = (pct) => {
    if (pct >= 80) return 'text-emerald-600';
    if (pct >= 60) return 'text-primary-600';
    if (pct >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  // TEST CARDS VIEW
  if (!selectedTest) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
          <p className="text-sm text-gray-500 mt-1">Select a test to view student results</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : testStats.length === 0 ? (
          <div className="section-card p-12">
            <div className="empty-state">
              <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium text-lg">No tests found</p>
              <p className="text-sm text-gray-400 mt-1">Create a test to see results here</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testStats.map((ts) => (
              <button
                key={ts.test._id}
                onClick={() => setSelectedTest(ts.test._id)}
                className="text-left section-card p-5 hover:shadow-lg hover:border-primary-200 border border-transparent transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">{ts.test.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{ts.test.branch} &middot; {ts.test.duration} min</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ts.test.status === 'active' ? 'bg-accent-50 text-accent-700' : 'bg-gray-100 text-gray-600'}`}>
                    {ts.test.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{ts.totalAttempts}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Attempts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-accent-600">{ts.passed}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Passed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{ts.failed}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Failed</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Avg</span>
                    <span className={`ml-1 font-semibold ${getScoreColor(ts.averageScore)}`}>{ts.averageScore}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">High</span>
                    <span className="ml-1 font-semibold text-accent-600">{ts.highestScore}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Low</span>
                    <span className="ml-1 font-semibold text-red-600">{ts.lowestScore}%</span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 mt-2">
                  {new Date(ts.test.startDate).toLocaleDateString()} - {new Date(ts.test.endDate).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // STUDENT RESULTS VIEW
  const selectedTestInfo = testStats.find(ts => ts.test._id === selectedTest);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedTest(null); setResults([]); setSearch(''); setStatusFilter(''); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedTestInfo?.test.title || 'Test Results'}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {results.length} result(s) &middot; Avg: {selectedTestInfo?.averageScore || 0}%
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedTestInfo && !selectedTestInfo.test._id && (
            <button onClick={() => handlePublish(selectedTest)} className="btn-primary text-sm">
              <Eye className="w-4 h-4" /> Publish All
            </button>
          )}
          <button onClick={() => navigate('/admin/coding-submissions')} className="btn-secondary text-sm">
            <Code className="w-4 h-4" /> Submissions
          </button>
          <button onClick={handleExport} className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-accent-50 border border-accent-200 rounded-xl text-accent-700 text-sm font-medium flex items-center gap-2 animate-fade-in-down">
          <CheckCircle2 className="w-4 h-4" />
          {successMessage}
          <button onClick={() => setSuccessMessage('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Stats Summary */}
      {selectedTestInfo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="stat-card border-l-4 border-l-primary-500">
            <p className="text-2xl font-bold text-gray-900">{selectedTestInfo.totalAttempts}</p>
            <p className="text-xs text-gray-500">Total Attempts</p>
          </div>
          <div className="stat-card border-l-4 border-l-accent-500">
            <p className="text-2xl font-bold text-accent-600">{selectedTestInfo.passed}</p>
            <p className="text-xs text-gray-500">Passed</p>
          </div>
          <div className="stat-card border-l-4 border-l-red-500">
            <p className="text-2xl font-bold text-red-600">{selectedTestInfo.failed}</p>
            <p className="text-xs text-gray-500">Failed</p>
          </div>
          <div className="stat-card border-l-4 border-l-violet-500">
            <p className="text-2xl font-bold text-gray-900">{selectedTestInfo.averageScore}%</p>
            <p className="text-xs text-gray-500">Average</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Student name, hall ticket..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
            </div>
          </div>
          <div className="min-w-[120px]">
            <label className="label">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
              <option value="">All</option>
              <option value="true">Pass</option>
              <option value="false">Fail</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="section-card overflow-hidden">
        {resultsLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No results found</p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">#</th>
                  <th className="table-header-cell">Student</th>
                  <th className="table-header-cell">College</th>
                  <th className="table-header-cell">Dept</th>
                  <th className="table-header-cell">Score</th>
                  <th className="table-header-cell">Percentage</th>
                  <th className="table-header-cell">Time</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((result, idx) => (
                  <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-500">{idx + 1}</td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{result.studentId?.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{result.studentId?.hallTicket}</div>
                    </td>
                    <td className="table-cell text-gray-600 text-xs">{result.studentId?.collegeName}</td>
                    <td className="table-cell text-gray-600 text-xs">{result.studentId?.branch}</td>
                    <td className="table-cell">
                      <div className="font-semibold text-gray-900">{result.obtainedMarks}/{result.totalMarks}</div>
                      {(result.mcqScore > 0 || result.codingScore > 0) && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          MCQ: {result.mcqScore} &middot; Code: {result.codingScore}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`font-semibold ${getScoreColor(result.percentage)}`}>{result.percentage}%</span>
                    </td>
                    <td className="table-cell text-gray-600 text-xs">
                      {result.timeTaken != null ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'N/A'}
                    </td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <span className={result.isPassed ? 'badge-success' : 'badge-danger'}>
                          {result.isPassed ? 'Pass' : 'Fail'}
                        </span>
                        {result.attempt?.status && <div>{getStatusBadge(result.attempt.status)}</div>}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        {result.attempt?.status && ['terminated', 'completed', 'timed_out'].includes(result.attempt.status) && (
                          <button onClick={() => handleResetExam(result.attempt._id)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors" title="Reset Exam">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {result.isPublished ? (
                          <button onClick={() => handleUnpublish(result.testId?._id)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Unpublish">
                            <EyeOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handlePublish(result.testId?._id)}
                            className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors" title="Publish">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
