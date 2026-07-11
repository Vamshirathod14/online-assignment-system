import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && role) {
      if (role === 'admin') navigate('/admin/dashboard');
      if (role === 'student') navigate('/student/dashboard');
    }
  }, [user, role, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-lg w-full mx-4 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Online Assignment System</h1>
        <p className="text-gray-500 mb-8">Examination & Assessment Platform</p>

        <div className="space-y-4">
          <Link
            to="/student/login"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Student Login
          </Link>
          <Link
            to="/admin/login"
            className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Admin Login
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-400">
          New student?{' '}
          <Link to="/student/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
