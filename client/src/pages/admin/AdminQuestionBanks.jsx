import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Search, Plus, Pencil, Trash2, HelpCircle, X, BookOpen, Copy } from 'lucide-react';

const initialBank = {
  name: '',
  description: '',
};

export default function AdminQuestionBanks() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialBank);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/question-banks');
      setBanks(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanks(); }, [fetchBanks]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Bank name is required';
    if (banks.some((b) => b.name.toLowerCase() === formData.name.trim().toLowerCase() && b._id !== editingId)) {
      newErrors.name = 'A question bank with this name already exists';
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
        await api.put(`/question-banks/${editingId}`, formData);
        toast.success('Question bank updated');
      } else {
        await api.post('/question-banks', formData);
        toast.success('Question bank created');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialBank);
      fetchBanks();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (bank) => {
    setFormData({ name: bank.name, description: bank.description || '' });
    setEditingId(bank._id);
    setShowForm(true);
    setApiError('');
  };

  const handleDelete = async (bank) => {
    if (!window.confirm(`Delete question bank "${bank.name}"?\n\nQuestions in this bank will become unassigned.`)) return;
    try {
      await api.delete(`/question-banks/${bank._id}`);
      toast.success('Question bank deleted');
      fetchBanks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDuplicate = async (bank) => {
    try {
      await api.post('/question-banks', { name: bank.name + ' (Copy)', description: bank.description });
      toast.success('Question bank duplicated');
      fetchBanks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate');
    }
  };

  const filtered = banks.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Banks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize questions into separate banks (e.g. Aptitude, Reasoning, Python). Uploads and tests can target a specific bank.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialBank); setApiError(''); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Create Question Bank
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search question banks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Question Bank' : 'Create Question Bank'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium">{apiError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Bank Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Aptitude, Reasoning, Python" className={`input-field ${errors.name ? 'border-red-400' : ''}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="input-field" placeholder="Optional description of this bank" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banks Grid */}
      <div className="section-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state py-12">
            <HelpCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No question banks found</p>
            {banks.length === 0 && (
              <p className="text-sm text-gray-400 mt-1">Create your first bank to start organizing questions.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filtered.map((bank) => (
              <div key={bank._id} className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(bank)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDuplicate(bank)} className="p-1.5 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(bank)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">{bank.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 min-h-[2.5rem]">{bank.description || 'No description'}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-700">{bank.questionCount} question(s)</span>
                  <button
                    onClick={() => navigate(`/admin/questions?bank=${bank._id}`)}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View Questions →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}