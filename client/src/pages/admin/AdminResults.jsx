import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Search, Download, Eye, EyeOff, CheckCircle2, X, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [testFilter, setTestFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tests, setTests] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchResults = useCallback(async () => {
    if (!testFilter) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('testId', testFilter);
      if (search) params.append('search', search);
      if (statusFilter) params.append('isPassed', statusFilter);

      const { data } = await api.get(`/results?${params.toString()}`);
      setResults(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [testFilter, search, statusFilter]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const { data } = await api.get('/tests');
        setTests(data.data);
      } catch {
        // ignore
      }
    };
    fetchTests();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleExport = async () => {
    if (!testFilter) return;
    try {
      const params = new URLSearchParams();
      params.append('testId', testFilter);
      if (search) params.append('search', search);
      if (statusFilter) params.append('isPassed', statusFilter);

      const response = await api.get(`/results/export?${params.toString()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'results.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export results');
    }
  };

  const handleResetExam = async (attemptId) => {
    if (!window.confirm('Are you sure you want to reset this terminated exam?')) return;
    try {
      await api.post(`/security/reset-exam/${attemptId}`);
      setSuccessMessage('Exam reset successfully');
      fetchResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset exam');
    }
  };

  const handlePublish = async (testId) => {
    try {
      await api.put(`/results/publish/${testId}`);
      setSuccessMessage('Results published successfully');
      fetchResults();
    } catch {
      toast.error('Failed to publish results');
    }
  };

  const handleUnpublish = async (testId) => {
    if (!window.confirm('Are you sure you want to unpublish these results?')) return;
    try {
      await api.put(`/results/unpublish/${testId}`);
      setSuccessMessage('Results unpublished successfully');
      fetchResults();
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
      default: return <span className="badge-neutral">{status || 'N/A'}</span>;
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  const hasActiveFilters = search || statusFilter;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
          <p className="text-sm text-gray-500 mt-1">{testFilter ? `${results.length} result(s)` : 'Select an exam to view results'}</p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3.5 bg-accent-50 border border-accent-200 rounded-xl text-accent-700 text-sm font-medium flex items-center gap-2 animate-fade-in-down">
          <CheckCircle2 className="w-4 h-4" />
          {successMessage}
          <button onClick={() => setSuccessMessage('')} className="ml-auto p-0.5 hover:bg-accent-100 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Exam Selection */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Select Exam *</label>
            <select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} className="input-field">
              <option value="">-- Choose an exam --</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
          </div>
          {testFilter && (
            <>
              <div className="flex-1 min-w-[200px]">
                <label className="label">Search</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Student name, hall ticket..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-10"
                  />
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
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-ghost text-sm">
                  Clear Filters
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {testFilter && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      )}

      {/* Results Table */}
      <div className="section-card overflow-hidden">
        {!testFilter ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Please select an exam to view results</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading results...</p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Student</th>
                  <th className="table-header-cell">College</th>
                  <th className="table-header-cell">Department</th>
                  <th className="table-header-cell">Marks</th>
                  <th className="table-header-cell">Percentage</th>
                  <th className="table-header-cell">Time Taken</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium mb-1">No results found</p>
                      <p className="text-gray-400 text-sm">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'No students have taken this exam yet'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{result.studentId?.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{result.studentId?.hallTicket}</div>
                      </td>
                      <td className="table-cell text-gray-600">{result.studentId?.collegeName}</td>
                      <td className="table-cell text-gray-600">{result.studentId?.branch}</td>
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">
                          {result.obtainedMarks}/{result.totalMarks}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">{result.percentage}%</div>
                      </td>
                      <td className="table-cell text-gray-600 text-xs">
                        {result.timeTaken != null ? `${Math.round(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'N/A'}
                      </td>
                      <td className="table-cell">
                        <div className="space-y-1">
                          <span className={result.isPassed ? 'badge-success' : 'badge-danger'}>
                            {result.isPassed ? 'Pass' : 'Fail'}
                          </span>
                          {result.attempt?.status && (
                            <div>{getStatusBadge(result.attempt.status)}</div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          {result.attempt?.status === 'terminated' && (
                            <button
                              onClick={() => handleResetExam(result.attempt?._id)}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Reset Exam"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {result.isPublished ? (
                            <button
                              onClick={() => handleUnpublish(result.testId?._id)}
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Unpublish"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(result.testId?._id)}
                              className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Publish"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
