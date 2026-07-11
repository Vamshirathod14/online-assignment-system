import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/admin/dashboard" className="text-xl font-bold text-indigo-600">
                OAS Admin
              </Link>
              <Link to="/admin/dashboard" className="text-gray-700 hover:text-indigo-600">
                Dashboard
              </Link>
              <Link to="/admin/students" className="text-gray-700 hover:text-indigo-600">
                Students
              </Link>
              <Link to="/admin/tests" className="text-gray-700 hover:text-indigo-600">
                Tests
              </Link>
              <Link to="/admin/questions" className="text-gray-700 hover:text-indigo-600">
                Questions
              </Link>
              <Link to="/admin/results" className="text-gray-700 hover:text-indigo-600">
                Results
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Admin: {user?.name}</span>
              <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
