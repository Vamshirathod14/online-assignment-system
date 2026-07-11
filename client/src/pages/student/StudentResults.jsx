import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await api.get('/results/my-results');
        setResults(data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Results</h1>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500">Loading results...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500 text-lg mb-2">No results available yet</p>
          <p className="text-sm text-gray-400">
            Results will appear here once published by the administrator.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">S.No</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Test</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Total Marks</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Obtained</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Percentage</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r, index) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{r.testId?.title || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.totalMarks}</td>
                    <td className="px-4 py-3 text-gray-600">{r.obtainedMarks}</td>
                    <td className="px-4 py-3 text-gray-600">{r.percentage}%</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {r.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
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
