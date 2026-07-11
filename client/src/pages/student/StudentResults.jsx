import { useState, useEffect } from 'react';
import api from '../../services/api';

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
        <div className="text-gray-500">Loading results...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Results</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Results
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Exam History
        </button>
      </div>

      {/* Results Tab */}
      {activeTab === 'results' && (
        <>
          {results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-gray-500 text-lg mb-2">Results are not yet published.</p>
              <p className="text-sm text-gray-400">
                Your results will appear here once published by the administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((r) => (
                <div key={r._id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{r.testId?.title}</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Name:</span> {r.studentId?.name || '-'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Hall Ticket:</span> {r.studentId?.hallTicket || '-'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Exam Date:</span>{' '}
                          {r.attempt?.startTime
                            ? new Date(r.attempt.startTime).toLocaleString()
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">
                        {r.obtainedMarks}/{r.totalMarks}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{r.percentage}%</div>
                      <div className="mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            r.isPassed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
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
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-gray-500 text-lg mb-2">No exam history available.</p>
              <p className="text-sm text-gray-400">
                Your exam history will appear here once results are published.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((h) => (
                    <tr key={h._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {h.test?.title || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {h.startTime ? new Date(h.startTime).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {h.obtainedMarks}/{h.totalMarks}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{h.percentage}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            h.isPassed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {h.isPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
