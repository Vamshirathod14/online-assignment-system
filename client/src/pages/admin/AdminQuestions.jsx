import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Search, Plus, Upload, Pencil, Trash2, HelpCircle, X } from 'lucide-react';

const initialQuestion = {
  questionText: '',
  questionType: 'mcq',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
  difficulty: 'medium',

  subject: '',
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialQuestion);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const { data } = await api.get('/questions', { params });
      setQuestions(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.questionText.trim()) newErrors.questionText = 'Question text is required';
    if (!formData.optionA.trim()) newErrors.optionA = 'Option A is required';
    if (!formData.optionB.trim()) newErrors.optionB = 'Option B is required';
    if (!formData.optionC.trim()) newErrors.optionC = 'Option C is required';
    if (!formData.optionD.trim()) newErrors.optionD = 'Option D is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    const payload = {
      questionText: formData.questionText,
      questionType: formData.questionType,
      options: [
        { label: 'A', text: formData.optionA },
        { label: 'B', text: formData.optionB },
        { label: 'C', text: formData.optionC },
        { label: 'D', text: formData.optionD },
      ],
      correctOption: formData.correctOption,
      difficulty: formData.difficulty,
      subject: formData.subject,
    };

    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, payload);
      } else {
        await api.post('/questions', payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialQuestion);
      fetchQuestions();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (q) => {
    const optMap = {};
    q.options.forEach((o) => { optMap[o.label] = o.text; });
    setFormData({
      questionText: q.questionText,
      questionType: q.questionType || 'mcq',
      optionA: optMap['A'] || '',
      optionB: optMap['B'] || '',
      optionC: optMap['C'] || '',
      optionD: optMap['D'] || '',
      correctOption: q.correctOption,
      difficulty: q.difficulty || 'medium',
      marks: q.marks,
      subject: q.subject,
    });
    setEditingId(q._id);
    setShowForm(true);
    setApiError('');
  };

  const handleDelete = async (id, text) => {
    if (!window.confirm(`Delete question "${text.substring(0, 40)}..."?`)) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions(questions.filter((q) => q._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      const { data } = await api.post('/questions/bulk-upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(data.data);
      fetchQuestions();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getDifficultyBadge = (d) => {
    if (d === 'easy') return <span className="badge-success">Easy</span>;
    if (d === 'hard') return <span className="badge-danger">Hard</span>;
    return <span className="badge-warning">Medium</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions Management</h1>
          <p className="text-sm text-gray-500 mt-1">{questions.length} question(s) in bank</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowUpload(true); setUploadResult(null); setUploadFile(null); setApiError(''); }}
            className="btn-success">
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialQuestion); setApiError(''); }}
            className="btn-primary">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions by text, subject, difficulty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Bulk Upload Questions</h2>
              <button onClick={() => { setShowUpload(false); setUploadResult(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Upload an Excel file (.xlsx) with columns: <strong>Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Difficulty, Marks, Subject</strong>
            </p>
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium">{apiError}</div>
            )}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-4 hover:border-primary-300 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <input type="file" accept=".xlsx,.xls" onChange={(e) => setUploadFile(e.target.files[0])}
                className="text-sm text-gray-600" />
            </div>
            {uploadResult && (
              <div className={`p-4 rounded-xl mb-4 ${uploadResult.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-accent-50 border border-accent-200'}`}>
                <p className="font-semibold text-sm mb-1 text-gray-900">Upload Summary</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-accent-700">Inserted: {uploadResult.inserted}</span>
                  <span className="text-amber-700">Skipped: {uploadResult.skipped}</span>
                  <span className="text-red-700">Failed: {uploadResult.failed}</span>
                </div>
                {uploadResult.errors?.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {uploadResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowUpload(false); setUploadResult(null); }} className="btn-secondary">Close</button>
              <button onClick={handleBulkUpload} disabled={uploading} className="btn-success">
                {uploading ? <span className="flex items-center gap-2"><span className="loading-spinner" /> Uploading...</span> : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Question Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium">{apiError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Question *</label>
                <textarea name="questionText" value={formData.questionText} onChange={handleChange} rows={3}
                  className={`input-field ${errors.questionText ? 'border-red-400' : ''}`} />
                {errors.questionText && <p className="text-red-500 text-xs mt-1">{errors.questionText}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((label) => (
                  <div key={label}>
                    <label className="label">Option {label} *</label>
                    <input name={`option${label}`} value={formData[`option${label}`]} onChange={handleChange}
                      className={`input-field ${errors[`option${label}`] ? 'border-red-400' : ''}`} />
                    {errors[`option${label}`] && <p className="text-red-500 text-xs mt-1">{errors[`option${label}`]}</p>}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Correct Answer *</label>
                  <select name="correctOption" value={formData.correctOption} onChange={handleChange} className="input-field">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="input-field">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input name="subject" value={formData.subject} onChange={handleChange}
                    className={`input-field ${errors.subject ? 'border-red-400' : ''}`} />
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <div className="section-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading questions...</p>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="empty-state py-12">
            <HelpCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No questions found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">#</th>
                  <th className="table-header-cell">Question</th>
                  <th className="table-header-cell">Subject</th>
                  <th className="table-header-cell">Difficulty</th>
                  <th className="table-header-cell">Correct</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions.map((q, index) => (
                  <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-500">{index + 1}</td>
                    <td className="table-cell font-medium text-gray-900 max-w-xs truncate">{q.questionText}</td>
                    <td className="table-cell text-gray-600">{q.subject}</td>
                    <td className="table-cell">{getDifficultyBadge(q.difficulty)}</td>
                    <td className="table-cell font-mono font-semibold text-gray-900">{q.correctOption}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(q)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(q._id, q.questionText)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
