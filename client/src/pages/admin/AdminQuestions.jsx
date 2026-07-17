import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Search, Plus, Upload, Pencil, Trash2, HelpCircle, X } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'MCQ (Single Choice)' },
  { value: 'multiple_select', label: 'Multiple Select' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'descriptive', label: 'Descriptive' },
  { value: 'coding', label: 'Coding' },
];

const initialQuestion = {
  questionText: '',
  questionType: 'mcq',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
  correctOptions: [],
  correctAnswer: '',
  difficulty: 'medium',
  subject: '',
  language: '',
  starterCode: '',
  inputExample: '',
  outputExample: '',
  memoryLimit: '256',
  timeLimit: '1000',
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

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData({ ...initialQuestion, questionType: newType, questionText: formData.questionText, difficulty: formData.difficulty, subject: formData.subject });
    setErrors({});
  };

  const handleMultiSelectOption = (label) => {
    setFormData((prev) => {
      const current = prev.correctOptions || [];
      const updated = current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label];
      return { ...prev, correctOptions: updated };
    });
  };

  const showOptions = ['mcq', 'multiple_select', 'true_false'].includes(formData.questionType);
  const showCorrectOption = formData.questionType === 'mcq' || formData.questionType === 'true_false';
  const showMultiCorrect = formData.questionType === 'multiple_select';
  const showCorrectAnswer = formData.questionType === 'fill_blank';
  const showCodingFields = formData.questionType === 'coding';

  const validate = () => {
    const newErrors = {};
    if (!formData.questionText.trim()) newErrors.questionText = 'Question text is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';

    if (formData.questionType === 'mcq') {
      if (!formData.optionA.trim()) newErrors.optionA = 'Option A is required';
      if (!formData.optionB.trim()) newErrors.optionB = 'Option B is required';
      if (!formData.optionC.trim()) newErrors.optionC = 'Option C is required';
      if (!formData.optionD.trim()) newErrors.optionD = 'Option D is required';
    } else if (formData.questionType === 'multiple_select') {
      if (!formData.optionA.trim()) newErrors.optionA = 'Option A is required';
      if (!formData.optionB.trim()) newErrors.optionB = 'Option B is required';
      if (!formData.optionC.trim()) newErrors.optionC = 'Option C is required';
      if (!formData.optionD.trim()) newErrors.optionD = 'Option D is required';
      if (!formData.correctOptions || formData.correctOptions.length === 0) {
        newErrors.correctOptions = 'Select at least one correct option';
      }
    } else if (formData.questionType === 'fill_blank') {
      if (!formData.correctAnswer.trim()) newErrors.correctAnswer = 'Correct answer is required';
    } else if (formData.questionType === 'coding') {
      if (!formData.language.trim()) newErrors.language = 'Language is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    let payload = {
      questionText: formData.questionText,
      questionType: formData.questionType,
      difficulty: formData.difficulty,
      subject: formData.subject,
    };

    if (formData.questionType === 'mcq') {
      payload.options = [
        { label: 'A', text: formData.optionA },
        { label: 'B', text: formData.optionB },
        { label: 'C', text: formData.optionC },
        { label: 'D', text: formData.optionD },
      ];
      payload.correctOption = formData.correctOption;
    } else if (formData.questionType === 'multiple_select') {
      payload.options = [
        { label: 'A', text: formData.optionA },
        { label: 'B', text: formData.optionB },
        { label: 'C', text: formData.optionC },
        { label: 'D', text: formData.optionD },
      ];
      payload.correctOptions = formData.correctOptions;
    } else if (formData.questionType === 'true_false') {
      payload.options = [
        { label: 'A', text: 'True' },
        { label: 'B', text: 'False' },
      ];
      payload.correctOption = formData.correctOption;
    } else if (formData.questionType === 'fill_blank') {
      payload.correctAnswer = formData.correctAnswer;
    } else if (formData.questionType === 'coding') {
      payload.language = formData.language;
      payload.starterCode = formData.starterCode;
      payload.inputExample = formData.inputExample;
      payload.outputExample = formData.outputExample;
      payload.memoryLimit = parseInt(formData.memoryLimit) || 256;
      payload.timeLimit = parseInt(formData.timeLimit) || 1000;
    }

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
    if (q.options) {
      q.options.forEach((o) => { optMap[o.label] = o.text; });
    }
    setFormData({
      questionText: q.questionText,
      questionType: q.questionType || 'mcq',
      optionA: optMap['A'] || '',
      optionB: optMap['B'] || '',
      optionC: optMap['C'] || '',
      optionD: optMap['D'] || '',
      correctOption: q.correctOption || 'A',
      correctOptions: q.correctOptions || [],
      correctAnswer: q.correctAnswer || '',
      difficulty: q.difficulty || 'medium',
      subject: q.subject || '',
      language: q.language || '',
      starterCode: q.starterCode || '',
      inputExample: q.inputExample || '',
      outputExample: q.outputExample || '',
      memoryLimit: q.memoryLimit?.toString() || '256',
      timeLimit: q.timeLimit?.toString() || '1000',
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
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
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

  const getTypeBadge = (t) => {
    const labels = { mcq: 'MCQ', multiple_select: 'Multi', true_false: 'T/F', fill_blank: 'Fill', descriptive: 'Desc', coding: 'Code' };
    return <span className="badge-info">{labels[t] || t}</span>;
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
                <label className="label">Question Type *</label>
                <select name="questionType" value={formData.questionType} onChange={handleTypeChange} className="input-field">
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Question *</label>
                <textarea name="questionText" value={formData.questionText} onChange={handleChange} rows={3}
                  className={`input-field ${errors.questionText ? 'border-red-400' : ''}`} />
                {errors.questionText && <p className="text-red-500 text-xs mt-1">{errors.questionText}</p>}
              </div>

              {showOptions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((label) => (
                    <div key={label}>
                      <label className="label">
                        Option {label} *
                        {formData.questionType === 'true_false' && <span className="text-gray-400 font-normal ml-1">(auto-filled)</span>}
                      </label>
                      <input
                        name={`option${label}`}
                        value={formData[`option${label}`]}
                        onChange={handleChange}
                        disabled={formData.questionType === 'true_false'}
                        className={`input-field ${errors[`option${label}`] ? 'border-red-400' : ''} ${formData.questionType === 'true_false' ? 'bg-gray-50' : ''}`}
                      />
                      {errors[`option${label}`] && <p className="text-red-500 text-xs mt-1">{errors[label]}</p>}
                    </div>
                  ))}
                </div>
              )}

              {showCorrectOption && (
                <div>
                  <label className="label">Correct Answer *</label>
                  <select name="correctOption" value={formData.correctOption} onChange={handleChange} className="input-field">
                    {formData.questionType === 'true_false' ? (
                      <>
                        <option value="A">True</option>
                        <option value="B">False</option>
                      </>
                    ) : (
                      <>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {showMultiCorrect && (
                <div>
                  <label className="label">Correct Options * (select one or more)</label>
                  <div className="flex gap-3 mt-1">
                    {['A', 'B', 'C', 'D'].map((label) => (
                      <label key={label} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData.correctOptions || []).includes(label)}
                          onChange={() => handleMultiSelectOption(label)}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.correctOptions && <p className="text-red-500 text-xs mt-1">{errors.correctOptions}</p>}
                </div>
              )}

              {showCorrectAnswer && (
                <div>
                  <label className="label">Correct Answer(s) * (comma-separated for multiple)</label>
                  <input name="correctAnswer" value={formData.correctAnswer} onChange={handleChange}
                    placeholder="e.g. OOP, Object Oriented Programming"
                    className={`input-field ${errors.correctAnswer ? 'border-red-400' : ''}`} />
                  {errors.correctAnswer && <p className="text-red-500 text-xs mt-1">{errors.correctAnswer}</p>}
                </div>
              )}

              {showCodingFields && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700">Coding Question Settings</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Language *</label>
                      <input name="language" value={formData.language} onChange={handleChange}
                        placeholder="e.g. JavaScript, Python"
                        className={`input-field ${errors.language ? 'border-red-400' : ''}`} />
                      {errors.language && <p className="text-red-500 text-xs mt-1">{errors.language}</p>}
                    </div>
                    <div>
                      <label className="label">Memory Limit (MB)</label>
                      <input name="memoryLimit" type="number" value={formData.memoryLimit} onChange={handleChange}
                        className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Time Limit (ms)</label>
                    <input name="timeLimit" type="number" value={formData.timeLimit} onChange={handleChange}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="label">Starter Code</label>
                    <textarea name="starterCode" value={formData.starterCode} onChange={handleChange} rows={4}
                      placeholder="// Write starter code here..."
                      className="input-field font-mono text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Input Example</label>
                      <textarea name="inputExample" value={formData.inputExample} onChange={handleChange} rows={3}
                        placeholder="Sample input..."
                        className="input-field font-mono text-xs" />
                    </div>
                    <div>
                      <label className="label">Output Example</label>
                      <textarea name="outputExample" value={formData.outputExample} onChange={handleChange} rows={3}
                        placeholder="Expected output..."
                        className="input-field font-mono text-xs" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <th className="table-header-cell">Type</th>
                  <th className="table-header-cell">Subject</th>
                  <th className="table-header-cell">Difficulty</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions.map((q, index) => (
                  <tr key={q._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-500">{index + 1}</td>
                    <td className="table-cell font-medium text-gray-900 max-w-xs truncate">{q.questionText}</td>
                    <td className="table-cell">{getTypeBadge(q.questionType)}</td>
                    <td className="table-cell text-gray-600">{q.subject}</td>
                    <td className="table-cell">{getDifficultyBadge(q.difficulty)}</td>
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
