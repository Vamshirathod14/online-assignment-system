import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const initialFormData = {
  title: '',
  description: '',
  branch: '',
  duration: '',
  totalQuestions: '',
  totalMarks: '',
  passingMarks: '',
  startDate: '',
  endDate: '',
  status: 'inactive',
};

export default function AdminTests() {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTestId, setAssignTestId] = useState(null);
  const [assignCount, setAssignCount] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [assignMode, setAssignMode] = useState('random');
  const [questionSearch, setQuestionSearch] = useState('');

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const { data } = await api.get('/tests', { params });
      setTests(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchQuestions = useCallback(async () => {
    try {
      const params = questionSearch ? { search: questionSearch } : {};
      const { data } = await api.get('/questions', { params });
      setQuestions(data.data);
    } catch {
      // ignore
    }
  }, [questionSearch]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required';
    if (!formData.duration || Number(formData.duration) <= 0) newErrors.duration = 'Valid duration is required';
    if (!formData.totalQuestions || Number(formData.totalQuestions) <= 0) newErrors.totalQuestions = 'Valid total questions is required';
    if (!formData.totalMarks || Number(formData.totalMarks) <= 0) newErrors.totalMarks = 'Valid total marks is required';
    if (!formData.passingMarks || Number(formData.passingMarks) <= 0) newErrors.passingMarks = 'Valid passing marks is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    try {
      if (editingId) {
        await api.put(`/tests/${editingId}`, formData);
      } else {
        await api.post('/tests', formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchTests();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (test) => {
    setFormData({
      title: test.title,
      description: test.description || '',
      branch: test.branch,
      duration: test.duration,
      totalQuestions: test.totalQuestions,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      startDate: test.startDate ? new Date(test.startDate).toISOString().slice(0, 16) : '',
      endDate: test.endDate ? new Date(test.endDate).toISOString().slice(0, 16) : '',
      status: test.status,
    });
    setEditingId(test._id);
    setShowForm(true);
    setApiError('');
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete test "${title}"?`)) return;
    try {
      await api.delete(`/tests/${id}`);
      setTests(tests.filter((t) => t._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await api.put(`/tests/${id}/toggle-status`);
      setTests(tests.map((t) => (t._id === id ? data.data : t)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const openAssignModal = async (test) => {
    setAssignTestId(test._id);
    setAssignMode('random');
    setAssignCount('');
    setSelectedQuestions([]);
    setQuestionSearch('');
    setShowAssignModal(true);
    await fetchQuestions();
  };

  const handleAssign = async () => {
    try {
      if (assignMode === 'random') {
        if (!assignCount || Number(assignCount) <= 0) {
          alert('Enter a valid number of questions');
          return;
        }
        await api.put(`/tests/${assignTestId}/assign-random`, { count: Number(assignCount) });
      } else {
        if (selectedQuestions.length === 0) {
          alert('Select at least one question');
          return;
        }
        await api.put(`/tests/${assignTestId}/assign-manual`, { questionIds: selectedQuestions });
      }
      setShowAssignModal(false);
      fetchTests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign questions');
    }
  };

  const toggleQuestionSelection = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Tests Management</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialFormData); setApiError(''); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + Create Test
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <input
          type="text"
          placeholder="Search tests by title, branch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Test' : 'Create Test'}</h2>
            {apiError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{apiError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Title *</label>
                  <input name="title" value={formData.title} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                  <input name="branch" value={formData.branch} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.branch ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min) *</label>
                  <input name="duration" type="number" value={formData.duration} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.duration ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions *</label>
                  <input name="totalQuestions" type="number" value={formData.totalQuestions} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.totalQuestions ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.totalQuestions && <p className="text-red-500 text-xs mt-1">{errors.totalQuestions}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
                  <input name="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.totalMarks ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.totalMarks && <p className="text-red-500 text-xs mt-1">{errors.totalMarks}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks *</label>
                  <input name="passingMarks" type="number" value={formData.passingMarks} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.passingMarks ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.passingMarks && <p className="text-red-500 text-xs mt-1">{errors.passingMarks}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input name="startDate" type="datetime-local" value={formData.startDate} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input name="endDate" type="datetime-local" value={formData.endDate} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500">
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Questions Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Assign Questions to Test</h2>
            <div className="flex gap-4 mb-4">
              <button onClick={() => setAssignMode('random')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${assignMode === 'random' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Random Selection
              </button>
              <button onClick={() => { setAssignMode('manual'); fetchQuestions(); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${assignMode === 'manual' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Manual Selection
              </button>
            </div>

            {assignMode === 'random' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
                <input type="number" min="1" value={assignCount} onChange={(e) => setAssignCount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter number of questions to randomly pick" />
              </div>
            ) : (
              <div>
                <input type="text" placeholder="Search questions..." value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-indigo-500" />
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {questions.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">No questions found</p>
                  ) : (
                    questions.map((q) => (
                      <label key={q._id}
                        className={`flex items-start gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedQuestions.includes(q._id) ? 'bg-indigo-50' : ''}`}>
                        <input type="checkbox" checked={selectedQuestions.includes(q._id)}
                          onChange={() => toggleQuestionSelection(q._id)} className="mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{q.questionText}</p>
                          <p className="text-xs text-gray-500">{q.subject} | {q.difficulty} | {q.marks} marks</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">{selectedQuestions.length} question(s) selected</p>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAssign}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tests Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <span className="text-sm text-gray-500">{tests.length} test(s) found</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : tests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">S.No</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Branch</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Duration</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Questions</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Marks</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tests.map((test, index) => (
                  <tr key={test._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{test.title}</td>
                    <td className="px-4 py-3 text-gray-600">{test.branch}</td>
                    <td className="px-4 py-3 text-gray-600">{test.duration} min</td>
                    <td className="px-4 py-3 text-gray-600">
                      {test.assignedQuestions?.length || 0} / {test.totalQuestions}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{test.totalMarks}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleStatus(test._id)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          test.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {test.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleEdit(test)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                        <button onClick={() => openAssignModal(test)} className="text-purple-600 hover:text-purple-800 text-xs font-medium">Assign</button>
                        <button onClick={() => handleDelete(test._id, test.title)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
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
