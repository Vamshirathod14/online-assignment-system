import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

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

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'timed_out':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasActiveFilters = search || testFilter || statusFilter || publishFilter;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Results Management</h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="Student name, hall ticket, or test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Test</label>
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Tests</option>
              {tests.map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Result</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="true">Pass</option>
              <option value="false">Fail</option>
            </select>
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Published</label>
            <select
              value={publishFilter}
              onChange={(e) => setPublishFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Export to Excel
        </button>
        <button
          onClick={handlePublishAll}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
        >
          Publish All
        </button>
        <button
          onClick={handleUnpublishAll}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
        >
          Unpublish All
        </button>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-gray-500">Loading results...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <p className="text-gray-500 text-lg mb-1">No results found</p>
                      <p className="text-gray-400 text-sm">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'Results will appear here once students complete exams'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr key={result._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{result.studentId?.name}</div>
                        <div className="text-xs text-gray-500">{result.studentId?.hallTicket}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{result.testId?.title}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {result.obtainedMarks}/{result.totalMarks}
                        </div>
                        <div className="text-xs text-gray-500">{result.percentage}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.isPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.attempt?.status)}`}>
                          {(result.attempt?.status || 'N/A').replace(/_/g, ' ')}
                        </span>
                        {result.attempt?.terminatedReason && (
                          <div className="text-xs text-red-600 mt-1">
                            {result.attempt.terminatedReason.replace(/_/g, ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {result.violationCount > 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {result.violationCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {result.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {result.isPublished ? (
                            <button
                              onClick={() => handleUnpublish(result.testId?._id)}
                              className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(result.testId?._id)}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                            >
                              Publish
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
