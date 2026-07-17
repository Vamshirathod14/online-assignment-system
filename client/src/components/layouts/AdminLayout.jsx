import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  HelpCircle,
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
  Building2,
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/tests', label: 'Tests', icon: ClipboardList },
  { to: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { to: '/admin/results', label: 'Results', icon: BarChart3 },
  { to: '/admin/colleges', label: 'Colleges', icon: Building2 },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/admin/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary-600">
                <Shield className="w-6 h-6" />
                <span>CoreSoft Admin</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.to)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in-down">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.to)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <footer className="border-t border-gray-100 bg-white py-4 text-center text-xs text-gray-400">
        Designed &amp; Developed by <span className="font-semibold text-gray-500">V Soft</span> &middot; Crafting Code. Powering Ideas.
      </footer>
    </div>
  );
}
