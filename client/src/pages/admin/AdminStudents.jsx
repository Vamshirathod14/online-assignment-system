import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Search, Download, Trash2, UserX } from 'lucide-react';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const { data } = await api.get('/students', { params });
      setStudents(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/students/${id}`);
      setStudents(students.filter((s) => s._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/students/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export students');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-sm text-gray-500 mt-1">{students.length} student(s) registered</p>
        </div>
        <button onClick={handleExport} className="btn-success">
          <Download className="w-4 h-4" /> Export to Excel
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, hall ticket, college, branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="section-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading students...</p>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state py-12">
            <UserX className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No students found</p>
            {search && <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>}
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">#</th>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Hall Ticket</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">College</th>
                  <th className="table-header-cell">Branch</th>
                  <th className="table-header-cell">Mobile</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, index) => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-500">{index + 1}</td>
                    <td className="table-cell font-medium text-gray-900">{student.name}</td>
                    <td className="table-cell font-mono text-xs text-gray-600">{student.hallTicket}</td>
                    <td className="table-cell text-gray-600">{student.email}</td>
                    <td className="table-cell text-gray-600">{student.collegeName}</td>
                    <td className="table-cell text-gray-600">{student.branch}</td>
                    <td className="table-cell font-mono text-xs text-gray-600">{student.mobileNumber}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleDelete(student._id, student.name)}
                        disabled={deletingId === student._id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                        aria-label={`Delete ${student.name}`}
                      >
                        {deletingId === student._id ? (
                          <span className="loading-spinner w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
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
