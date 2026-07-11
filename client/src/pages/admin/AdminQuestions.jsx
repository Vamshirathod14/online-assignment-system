import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const initialQuestion = {
  questionText: '',
  questionType: 'mcq',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
  difficulty: 'medium',
  marks: '1',
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
    if (!formData.marks || Number(formData.marks) <= 0) newErrors.marks = 'Valid marks required';
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
      marks: Number(formData.marks),
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

  const getDifficultyColor = (d) => {
    if (d === 'easy') return 'bg-green-100 text-green-700';
    if (d === 'hard') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Questions Management</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowUpload(true); setUploadResult(null); setUploadFile(null); setApiError(''); }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">
            Bulk Upload
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialQuestion); setApiError(''); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
            + Add Question
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <input
          type="text"
          placeholder="Search questions by text, subject, difficulty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Bulk Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Bulk Upload Questions</h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload an Excel file (.xlsx) with columns: <strong>Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Difficulty, Marks, Subject</strong>
            </p>
            {apiError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{apiError}</div>}
            <input type="file" accept=".xlsx,.xls" onChange={(e) => setUploadFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4" />
            {uploadResult && (
              <div className={`p-4 rounded-lg mb-4 ${uploadResult.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                <p className="font-semibold text-sm mb-1">Upload Summary:</p>
                <p className="text-sm text-green-700">Inserted: {uploadResult.inserted}</p>
                <p className="text-sm text-yellow-700">Skipped: {uploadResult.skipped}</p>
                <p className="text-sm text-red-700">Failed: {uploadResult.failed}</p>
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
              <button onClick={() => { setShowUpload(false); setUploadResult(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Close
              </button>
              <button onClick={handleBulkUpload} disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Question Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Question' : 'Add Question'}</h2>
            {apiError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{apiError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea name="questionText" value={formData.questionText} onChange={handleChange} rows={3}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.questionText ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.questionText && <p className="text-red-500 text-xs mt-1">{errors.questionText}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Option A *</label>
                  <input name="optionA" value={formData.optionA} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.optionA ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.optionA && <p className="text-red-500 text-xs mt-1">{errors.optionA}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Option B *</label>
                  <input name="optionB" value={formData.optionB} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.optionB ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.optionB && <p className="text-red-500 text-xs mt-1">{errors.optionB}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Option C *</label>
                  <input name="optionC" value={formData.optionC} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.optionC ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.optionC && <p className="text-red-500 text-xs mt-1">{errors.optionC}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Option D *</label>
                  <input name="optionD" value={formData.optionD} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.optionD ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.optionD && <p className="text-red-500 text-xs mt-1">{errors.optionD}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                  <select name="correctOption" value={formData.correctOption} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks *</label>
                  <input name="marks" type="number" min="1" value={formData.marks} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.marks ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.marks && <p className="text-red-500 text-xs mt-1">{errors.marks}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input name="subject" value={formData.subject} onChange={handleChange}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 ${errors.subject ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <span className="text-sm text-gray-500">{questions.length} question(s) found</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No questions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">S.No</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Question</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Subject</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Difficulty</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Marks</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Correct</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions.map((q, index) => (
                  <tr key={q._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{q.questionText}</td>
                    <td className="px-4 py-3 text-gray-600">{q.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{q.marks}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{q.correctOption}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(q)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(q._id, q.questionText)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
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
