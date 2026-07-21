import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ClipboardList, X, BarChart3 } from 'lucide-react';
import { DEPARTMENTS } from '../../constants/departments';

const initialFormData = {
  title: '',
  description: '',
  branch: '',
  duration: '',
  totalQuestions: '',
  passingMarks: '',
  mcqsRequired: '',
  trueFalseRequired: '',
  fillBlanksRequired: '',
  codingRequired: '',
  startDate: '',
  endDate: '',
  status: 'inactive',
};

export default function AdminTests() {
  const navigate = useNavigate();
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
      let newTestId = editingId;
      if (editingId) {
        await api.put(`/tests/${editingId}`, formData);
      } else {
        const { data } = await api.post('/tests', formData);
        newTestId = data.data._id;
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      await fetchTests();
      if (!editingId && newTestId) {
        const test = (await api.get(`/tests/${newTestId}`)).data.data;
        openAssignModal(test);
      }
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
      passingMarks: test.passingMarks,
      mcqsRequired: test.mcqsRequired || '',
      trueFalseRequired: test.trueFalseRequired || '',
      fillBlanksRequired: test.fillBlanksRequired || '',
      codingRequired: test.codingRequired || '',
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
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await api.put(`/tests/${id}/toggle-status`);
      setTests(tests.map((t) => (t._id === id ? data.data : t)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
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
          toast.error('Enter a valid number of questions');
          return;
        }
        await api.put(`/tests/${assignTestId}/assign-random`, { count: Number(assignCount) || undefined });
      } else {
        if (selectedQuestions.length === 0) {
          toast.error('Select at least one question');
          return;
        }
        await api.put(`/tests/${assignTestId}/assign-manual`, { questionIds: selectedQuestions });
      }
      setShowAssignModal(false);
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign questions');
    }
  };

  const toggleQuestionSelection = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tests Management</h1>
          <p className="text-sm text-gray-500 mt-1">{tests.length} test(s)</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialFormData); setApiError(''); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Create Test
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tests by title, branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Test' : 'Create Test'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium">
                {apiError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Test Title *</label>
                  <input name="title" value={formData.title} onChange={handleChange} className={`input-field ${errors.title ? 'border-red-400' : ''}`} />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="label">Branch *</label>
                  <select name="branch" value={formData.branch} onChange={handleChange} className={`input-field ${errors.branch ? 'border-red-400' : ''}`}>
                    <option value="">Select Branch</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch}</p>}
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="input-field" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Duration (min) *</label>
                  <input name="duration" type="number" value={formData.duration} onChange={handleChange} className={`input-field ${errors.duration ? 'border-red-400' : ''}`} />
                  {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                </div>
                <div>
                  <label className="label">Total Questions *</label>
                  <input name="totalQuestions" type="number" value={formData.totalQuestions} onChange={handleChange} className={`input-field ${errors.totalQuestions ? 'border-red-400' : ''}`} />
                  {errors.totalQuestions && <p className="text-red-500 text-xs mt-1">{errors.totalQuestions}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="label">MCQs Required</label>
                  <input name="mcqsRequired" type="number" min="0" value={formData.mcqsRequired} onChange={handleChange} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="label">True/False Required</label>
                  <input name="trueFalseRequired" type="number" min="0" value={formData.trueFalseRequired} onChange={handleChange} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="label">Fill Blanks Required</label>
                  <input name="fillBlanksRequired" type="number" min="0" value={formData.fillBlanksRequired} onChange={handleChange} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="label">Coding Required</label>
                  <input name="codingRequired" type="number" min="0" value={formData.codingRequired} onChange={handleChange} className="input-field" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Passing Marks *</label>
                  <input name="passingMarks" type="number" value={formData.passingMarks} onChange={handleChange} className={`input-field ${errors.passingMarks ? 'border-red-400' : ''}`} />
                  {errors.passingMarks && <p className="text-red-500 text-xs mt-1">{errors.passingMarks}</p>}
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input name="startDate" type="datetime-local" value={formData.startDate} onChange={handleChange} className={`input-field ${errors.startDate ? 'border-red-400' : ''}`} />
                  {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input name="endDate" type="datetime-local" value={formData.endDate} onChange={handleChange} className={`input-field ${errors.endDate ? 'border-red-400' : ''}`} />
                  {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Questions Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Assign Questions</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              <button onClick={() => setAssignMode('random')}
                className={`btn text-sm ${assignMode === 'random' ? 'btn-primary' : 'btn-secondary'}`}>
                Random Selection
              </button>
              <button onClick={() => { setAssignMode('manual'); fetchQuestions(); }}
                className={`btn text-sm ${assignMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}>
                Manual Selection
              </button>
            </div>

            {assignMode === 'random' ? (
              <div className="mb-4">
                <label className="label">Number of Questions</label>
                <input type="number" min="1" value={assignCount} onChange={(e) => setAssignCount(e.target.value)}
                  className="input-field" placeholder="Enter number of questions to randomly pick" />
              </div>
            ) : (
              <div>
                <div className="relative mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search questions..." value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="input-field pl-10" />
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                  {questions.length === 0 ? (
                    <p className="p-6 text-gray-500 text-center text-sm">No questions found</p>
                  ) : (
                    questions.map((q) => (
                      <label key={q._id}
                        className={`flex items-start gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedQuestions.includes(q._id) ? 'bg-primary-50' : ''}`}>
                        <input type="checkbox" checked={selectedQuestions.includes(q._id)}
                          onChange={() => toggleQuestionSelection(q._id)} className="mt-1 rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{q.questionText}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">{q.subject}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${q.difficulty === 'easy' ? 'bg-green-50 text-green-700' : q.difficulty === 'hard' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                              {q.difficulty}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                              {q.questionType === 'mcq' ? 'MCQ' : q.questionType === 'coding' ? 'Code' : q.questionType === 'true_false' ? 'T/F' : q.questionType === 'multiple_select' ? 'Multi' : q.questionType === 'fill_blank' ? 'Fill' : q.questionType === 'descriptive' ? 'Desc' : q.questionType}
                            </span>
                            <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">{selectedQuestions.length} question(s) selected</p>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleAssign} className="btn-primary">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Tests Table */}
      <div className="section-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading tests...</p>
            </div>
          </div>
        ) : tests.length === 0 ? (
          <div className="empty-state py-12">
            <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No tests found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">#</th>
                  <th className="table-header-cell">Title</th>
                  <th className="table-header-cell">Branch</th>
                  <th className="table-header-cell">Duration</th>
                  <th className="table-header-cell">Questions</th>
                  <th className="table-header-cell">Marks</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tests.map((test, index) => (
                  <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-500">{index + 1}</td>
                    <td className="table-cell font-medium text-gray-900">{test.title}</td>
                    <td className="table-cell text-gray-600">{test.branch}</td>
                    <td className="table-cell text-gray-600">{test.duration} min</td>
                    <td className="table-cell text-gray-600">
                      {test.assignedQuestions?.length || 0} / {test.totalQuestions}
                    </td>
                    <td className="table-cell text-gray-600">{test.totalMarks}</td>
                    <td className="table-cell">
                      <button onClick={() => handleToggleStatus(test._id)}
                        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          test.status === 'active' ? 'bg-accent-50 text-accent-700 hover:bg-accent-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {test.status === 'active' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {test.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/admin/tests/${test._id}`)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="View Details">
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEdit(test)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openAssignModal(test)} className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Assign Questions">
                          <ClipboardList className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(test._id, test.title)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
