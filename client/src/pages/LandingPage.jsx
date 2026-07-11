import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { GraduationCap, Shield, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-300 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-6">
          <GraduationCap className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Online Assignment System</h1>
        <p className="text-gray-500 mb-8 text-sm">Examination & Assessment Platform</p>

        <div className="space-y-3">
          <Link
            to="/student/login"
            className="group flex items-center justify-center gap-3 w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <GraduationCap className="w-5 h-5" />
            Student Login
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
          <Link
            to="/admin/login"
            className="group flex items-center justify-center gap-3 w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Shield className="w-5 h-5" />
            Admin Login
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          New student?{' '}
          <Link to="/student/register" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
