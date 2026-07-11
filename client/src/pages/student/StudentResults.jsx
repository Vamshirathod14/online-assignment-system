import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, Clock, AlertTriangle, CheckCircle2, History, BarChart3 } from 'lucide-react';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsRes, historyRes] = await Promise.all([
          api.get('/results/my-results'),
          api.get('/results/exam-history'),
        ]);
        setResults(resultsRes.data.data);
        setHistory(historyRes.data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Results</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-px">
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
            activeTab === 'results'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Award className="w-4 h-4" />
          Results
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
            activeTab === 'history'
              ? 'border-primary-600 text-primary-700 bg-primary-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <History className="w-4 h-4" />
          Exam History
        </button>
      </div>

      {/* Results Tab */}
      {activeTab === 'results' && (
        <>
          {results.length === 0 ? (
            <div className="section-card p-12">
              <div className="empty-state">
                <Award className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium text-lg mb-1">Results are not yet published</p>
                <p className="text-sm text-gray-400">Your results will appear here once published by the administrator.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((r) => (
                <div key={r._id} className="section-card p-6 animate-fade-in-up">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{r.testId?.title}</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Name:</span> {r.studentId?.name || '-'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Hall Ticket:</span> {r.studentId?.hallTicket || '-'}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {r.attempt?.startTime ? new Date(r.attempt.startTime).toLocaleString() : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:min-w-[140px]">
                      <div className="text-3xl font-bold text-gray-900">
                        {r.obtainedMarks}<span className="text-lg text-gray-400 font-normal">/{r.totalMarks}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{r.percentage}%</div>
                      <div className="mt-2">
                        <span className={r.isPassed ? 'badge-success' : 'badge-danger'}>
                          {r.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Exam History Tab */}
      {activeTab === 'history' && (
        <>
          {history.length === 0 ? (
            <div className="section-card p-12">
              <div className="empty-state">
                <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium text-lg mb-1">No exam history available</p>
                <p className="text-sm text-gray-400">Your exam history will appear here once results are published.</p>
              </div>
            </div>
          ) : (
            <div className="section-card overflow-hidden">
              <div className="table-container">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Test</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Score</th>
                      <th className="table-header-cell">Percentage</th>
                      <th className="table-header-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((h) => (
                      <tr key={h._id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-cell font-medium text-gray-900">
                          {h.test?.title || '-'}
                        </td>
                        <td className="table-cell text-gray-600">
                          {h.startTime ? new Date(h.startTime).toLocaleDateString() : '-'}
                        </td>
                        <td className="table-cell font-semibold text-gray-900">
                          {h.obtainedMarks}/{h.totalMarks}
                        </td>
                        <td className="table-cell text-gray-600">{h.percentage}%</td>
                        <td className="table-cell">
                          <span className={h.isPassed ? 'badge-success' : 'badge-danger'}>
                            {h.isPassed ? 'Pass' : 'Fail'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
