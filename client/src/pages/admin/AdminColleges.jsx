import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Search, Plus, Pencil, Trash2, Building2, X, ToggleLeft, ToggleRight } from 'lucide-react';

const initialCollege = {
  name: '',
  code: '',
  location: '',
  status: 'active',
};

export default function AdminColleges() {
  const [colleges, setColleges] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialCollege);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const fetchColleges = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const { data } = await api.get('/colleges', { params });
      setColleges(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchColleges(); }, [fetchColleges]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'College name is required';
    if (!formData.code.trim()) newErrors.code = 'College code is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    try {
      if (editingId) {
        await api.put(`/colleges/${editingId}`, formData);
      } else {
        await api.post('/colleges', formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialCollege);
      fetchColleges();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (college) => {
    setFormData({
      name: college.name,
      code: college.code,
      location: college.location,
      status: college.status || 'active',
    });
    setEditingId(college._id);
    setShowForm(true);
    setApiError('');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete college "${name}"?`)) return;
    try {
      await api.delete(`/colleges/${id}`);
      setColleges(colleges.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/colleges/${id}/toggle-status`);
      fetchColleges();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colleges Management</h1>
          <p className="text-sm text-gray-500 mt-1">{colleges.length} college(s)</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialCollege); setApiError(''); }}
          className="btn-primary">
          <Plus className="w-4 h-4" /> Add College
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search colleges by name, code, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit College' : 'Add College'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium">{apiError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">College Name *</label>
                <input name="name" value={formData.name} onChange={handleChange}
                  placeholder="e.g. VNR VJIET"
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Code *</label>
                  <input name="code" value={formData.code} onChange={handleChange}
                    placeholder="e.g. VNR"
                    className={`input-field ${errors.code ? 'border-red-400' : ''}`} />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                </div>
                <div>
                  <label className="label">Location *</label>
                  <input name="location" value={formData.location} onChange={handleChange}
                    placeholder="e.g. Hyderabad"
                    className={`input-field ${errors.location ? 'border-red-400' : ''}`} />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Colleges Table */}
      <div className="section-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading colleges...</p>
            </div>
          </div>
        ) : colleges.length === 0 ? (
          <div className="empty-state py-12">
            <Building2 className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No colleges found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">#</th>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Code</th>
                  <th className="table-header-cell">Location</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {colleges.map((college, index) => (
                  <tr key={college._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-500">{index + 1}</td>
                    <td className="table-cell font-medium text-gray-900">{college.name}</td>
                    <td className="table-cell font-mono text-xs text-gray-600">{college.code}</td>
                    <td className="table-cell text-gray-600">{college.location}</td>
                    <td className="table-cell">
                      <span className={college.status === 'active' ? 'badge-success' : 'badge-neutral'}>
                        {college.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => handleToggleStatus(college._id)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title={college.status === 'active' ? 'Deactivate' : 'Activate'}>
                          {college.status === 'active' ? <ToggleRight className="w-4 h-4 text-accent-600" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(college)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(college._id, college.name)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
