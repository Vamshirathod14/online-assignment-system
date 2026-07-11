import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Search, Download, Eye, EyeOff, CheckCircle2, X, AlertTriangle } from 'lucide-react';

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [testFilter, setTestFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [tests, setTests] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (testFilter) params.append('testId', testFilter);
      if (statusFilter) params.append('isPassed', statusFilter);
      if (publishFilter) params.append('isPublished', publishFilter);

      const { data } = await api.get(`/results?${params.toString()}`);
      setResults(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, testFilter, statusFilter, publishFilter]);

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

  const handlePublish = async (testId) => {
    try {
      await api.put(`/results/publish/${testId}`);
      setSuccessMessage('Results published successfully');
      fetchResults();
    } catch {
      alert('Failed to publish results');
    }
  };

  const handleUnpublish = async (testId) => {
    if (!window.confirm('Are you sure you want to unpublish these results?')) return;
    try {
      await api.put(`/results/unpublish/${testId}`);
      setSuccessMessage('Results unpublished successfully');
      fetchResults();
    } catch {
      alert('Failed to unpublish results');
    }
  };

  const handlePublishAll = async () => {
    if (!window.confirm('Are you sure you want to publish ALL unpublished results?')) return;
    try {
      await api.put('/results/publish-all');
      setSuccessMessage('All results published successfully');
      fetchResults();
    } catch {
      alert('Failed to publish all results');
    }
  };

  const handleUnpublishAll = async () => {
    if (!window.confirm('Are you sure you want to unpublish ALL published results?')) return;
    try {
      await api.put('/results/unpublish-all');
      setSuccessMessage('All results unpublished successfully');
      fetchResults();
    } catch {
      alert('Failed to unpublish all results');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (testFilter) params.append('testId', testFilter);
      if (statusFilter) params.append('isPassed', statusFilter);
      if (publishFilter) params.append('isPublished', publishFilter);

      const response = await api.get(`/results/export?${params.toString()}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'results.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export results');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTestFilter('');
    setStatusFilter('');
    setPublishFilter('');
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

  const hasActiveFilters = search || testFilter || statusFilter || publishFilter;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
          <p className="text-sm text-gray-500 mt-1">{results.length} result(s)</p>
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

      {/* Search & Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Student name, hall ticket, or test..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="label">Test</label>
            <select value={testFilter} onChange={(e) => setTestFilter(e.target.value)} className="input-field">
              <option value="">All Tests</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="label">Result</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
              <option value="">All</option>
              <option value="true">Pass</option>
              <option value="false">Fail</option>
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="label">Published</label>
            <select value={publishFilter} onChange={(e) => setPublishFilter(e.target.value)} className="input-field">
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-ghost text-sm">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" /> Export to Excel
        </button>
        <button onClick={handlePublishAll} className="btn-success">
          <Eye className="w-4 h-4" /> Publish All
        </button>
        <button onClick={handleUnpublishAll} className="btn-secondary">
          <EyeOff className="w-4 h-4" /> Unpublish All
        </button>
      </div>

      {/* Results Table */}
      <div className="section-card overflow-hidden">
        {loading ? (
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
                  <th className="table-header-cell">Test</th>
                  <th className="table-header-cell">Score</th>
                  <th className="table-header-cell">Result</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Violations</th>
                  <th className="table-header-cell">Published</th>
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
                        {hasActiveFilters ? 'Try adjusting your filters' : 'Results will appear here once students complete exams'}
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
                      <td className="table-cell text-gray-900 font-medium">{result.testId?.title}</td>
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">
                          {result.obtainedMarks}/{result.totalMarks}
                        </div>
                        <div className="text-xs text-gray-500">{result.percentage}%</div>
                      </td>
                      <td className="table-cell">
                        <span className={result.isPassed ? 'badge-success' : 'badge-danger'}>
                          {result.isPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="space-y-1">
                          {getStatusBadge(result.attempt?.status)}
                          {result.attempt?.terminatedReason && (
                            <div className="text-xs text-red-600">
                              {result.attempt.terminatedReason.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        {result.violationCount > 0 ? (
                          <span className="badge-danger">{result.violationCount}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">0</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className={result.isPublished ? 'badge-success' : 'badge-neutral'}>
                          {result.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="table-cell">
                        {result.isPublished ? (
                          <button
                            onClick={() => handleUnpublish(result.testId?._id)}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                            title="Unpublish"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublish(result.testId?._id)}
                            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 p-1.5 rounded-lg transition-colors"
                            title="Publish"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
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
