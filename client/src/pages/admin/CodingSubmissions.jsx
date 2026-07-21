import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  ChevronLeft, Search, ChevronDown, ChevronUp, Check, X,
  Code, Download, Filter,
} from 'lucide-react';

const LANGUAGES = ['python', 'java', 'c', 'cpp', 'javascript'];

export default function CodingSubmissions() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (languageFilter) params.language = languageFilter;
      const { data } = await api.get('/code/submissions', { params });
      setSubmissions(data.data || []);
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, languageFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleDownloadCode = async (submissionId, language) => {
    try {
      const response = await api.get(`/code/submission/${submissionId}/download`, { responseType: 'blob' });
      const ext = { python: 'py', java: 'java', c: 'c', cpp: 'cpp', javascript: 'js' };
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submission.${ext[language] || 'txt'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download code');
    }
  };

  const handleDownloadAllZip = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (languageFilter) params.append('language', languageFilter);
      const response = await api.get(`/code/submissions/export-zip?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'coding_submissions.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Submissions downloaded');
    } catch {
      toast.error('Failed to download submissions');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted': return <span className="badge-success">Accepted</span>;
      case 'wrong_answer': return <span className="badge-danger">Wrong Answer</span>;
      case 'compile_error': return <span className="badge-danger">Compile Error</span>;
      case 'runtime_error': return <span className="badge-danger">Runtime Error</span>;
      case 'timeout': return <span className="badge-warning">Timeout</span>;
      default: return <span className="badge-neutral">{status}</span>;
    }
  };

  const getLanguageColor = (lang) => {
    const colors = {
      python: 'bg-blue-100 text-blue-700',
      java: 'bg-orange-100 text-orange-700',
      c: 'bg-gray-100 text-gray-700',
      cpp: 'bg-purple-100 text-purple-700',
      javascript: 'bg-yellow-100 text-yellow-700',
    };
    return colors[lang] || 'bg-gray-100 text-gray-700';
  };

  const hasActiveFilters = statusFilter || languageFilter;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/results')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coding Submissions</h1>
            <p className="text-sm text-gray-500 mt-0.5">{submissions.length} submission(s)</p>
          </div>
        </div>
        <button onClick={handleDownloadAllZip} className="btn-secondary text-sm" disabled={submissions.length === 0}>
          <Download className="w-4 h-4" /> Download All (.zip)
        </button>
      </div>

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
          <div className="min-w-[140px]">
            <label className="label">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
              <option value="">All</option>
              <option value="accepted">Accepted</option>
              <option value="wrong_answer">Wrong Answer</option>
              <option value="compile_error">Compile Error</option>
              <option value="runtime_error">Runtime Error</option>
              <option value="timeout">Timeout</option>
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="label">Language</label>
            <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className="input-field">
              <option value="">All</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <button onClick={() => { setStatusFilter(''); setLanguageFilter(''); setSearch(''); }} className="btn-ghost text-sm">
              <Filter className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="section-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Code className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No submissions found</p>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell w-8"></th>
                  <th className="table-header-cell">Student</th>
                  <th className="table-header-cell">Question</th>
                  <th className="table-header-cell">Language</th>
                  <th className="table-header-cell">Test Cases</th>
                  <th className="table-header-cell">Marks</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Time</th>
                  <th className="table-header-cell">Memory</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub) => (
                  <React.Fragment key={sub._id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <button onClick={() => setExpandedId(expandedId === sub._id ? null : sub._id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors">
                          {expandedId === sub._id
                            ? <ChevronUp className="w-4 h-4 text-gray-500" />
                            : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        </button>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-gray-900">{sub.studentId?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500 font-mono">{sub.studentId?.hallTicket || ''}</div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {sub.questionId?.questionText || 'N/A'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getLanguageColor(sub.language)}`}>
                          {sub.language}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`font-semibold ${sub.passedTestCases === sub.totalTestCases ? 'text-green-600' : 'text-red-600'}`}>
                          {sub.passedTestCases}/{sub.totalTestCases}
                        </span>
                      </td>
                      <td className="table-cell font-semibold text-gray-900">{sub.marksAwarded}</td>
                      <td className="table-cell">{getStatusBadge(sub.status)}</td>
                      <td className="table-cell text-gray-500 text-xs">{sub.executionTime}ms</td>
                      <td className="table-cell text-gray-500 text-xs">{sub.memoryUsed ? `${(sub.memoryUsed / 1024).toFixed(1)}MB` : 'N/A'}</td>
                      <td className="table-cell">
                        <button onClick={() => handleDownloadCode(sub._id, sub.language)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Download Code">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    {expandedId === sub._id && (
                      <tr key={`${sub._id}-details`}>
                        <td colSpan="10" className="p-4 bg-gray-50">
                          <div className="space-y-4 max-w-4xl">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Source Code</p>
                              <pre className="text-xs font-mono bg-gray-900 text-green-400 p-4 rounded-xl overflow-auto max-h-64">
                                {sub.sourceCode}
                              </pre>
                            </div>

                            {sub.compileError && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-xs font-semibold text-red-600 uppercase mb-1">Compile Error</p>
                                <pre className="text-xs font-mono text-red-700 overflow-auto max-h-32">{sub.compileError}</pre>
                              </div>
                            )}
                            {sub.runtimeError && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-xs font-semibold text-red-600 uppercase mb-1">Runtime Error</p>
                                <pre className="text-xs font-mono text-red-700 overflow-auto max-h-32">{sub.runtimeError}</pre>
                              </div>
                            )}

                            {sub.testCaseResults?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Test Case Results</p>
                                <div className="space-y-2">
                                  {sub.testCaseResults.map((tc, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border ${tc.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold">Test Case {idx + 1}</span>
                                        <div className="flex items-center gap-2">
                                          {tc.executionTime != null && <span className="text-xs text-gray-400">{tc.executionTime}ms</span>}
                                          {tc.memoryUsed > 0 && <span className="text-xs text-gray-400">{(tc.memoryUsed / 1024).toFixed(1)}MB</span>}
                                          {tc.passed
                                            ? <Check className="w-4 h-4 text-green-600" />
                                            : <X className="w-4 h-4 text-red-600" />}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div>
                                          <p className="text-gray-500 font-medium mb-1">Input</p>
                                          <pre className="font-mono bg-white p-2 rounded border border-gray-100 overflow-auto max-h-16">{tc.input || '(stdin)'}</pre>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 font-medium mb-1">Expected</p>
                                          <pre className="font-mono bg-white p-2 rounded border border-gray-100 overflow-auto max-h-16">{tc.expectedOutput}</pre>
                                        </div>
                                        <div>
                                          <p className="text-gray-500 font-medium mb-1">Actual</p>
                                          <pre className="font-mono bg-white p-2 rounded border border-gray-100 overflow-auto max-h-16">{tc.actualOutput || tc.status}</pre>
                                        </div>
                                      </div>
                                      {tc.compileError && (
                                        <pre className="text-xs font-mono text-red-600 mt-2 bg-red-50 p-2 rounded">{tc.compileError}</pre>
                                      )}
                                      {tc.runtimeError && (
                                        <pre className="text-xs font-mono text-red-600 mt-2 bg-red-50 p-2 rounded">{tc.runtimeError}</pre>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
