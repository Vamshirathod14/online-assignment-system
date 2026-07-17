import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { GraduationCap, ArrowLeft, Mail, Lock, Eye, EyeOff, User, Building2, BookOpen, CreditCard, Phone } from 'lucide-react';
import { DEPARTMENTS } from '../../constants/departments';
import { titleCase } from '../../utils/textUtils';

const initialFormData = {
  name: '',
  fatherName: '',
  collegeName: '',
  branch: '',
  hallTicket: '',
  email: '',
  mobileNumber: '',
  password: '',
  confirmPassword: '',
};

export default function StudentRegister() {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [colleges, setColleges] = useState([]);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/colleges/active').then(({ data }) => setColleges(data.data || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const autoCapitalizeFields = ['name', 'fatherName', 'collegeName'];
    const newValue = autoCapitalizeFields.includes(name) ? titleCase(value) : value;
    setFormData({ ...formData, [name]: newValue });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.collegeName.trim()) newErrors.collegeName = 'College name is required';
    if (!formData.branch.trim()) newErrors.branch = 'Branch is required';
    if (!formData.hallTicket.trim()) newErrors.hallTicket = 'Hall ticket is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData, 'student');
      navigate('/student/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', icon: User, colSpan: 2 },
    { name: 'fatherName', label: 'Father Name', type: 'text', placeholder: "Enter father's name", icon: User, colSpan: 2 },
    { name: 'collegeName', label: 'College Name', type: 'select', placeholder: 'Select your college', icon: Building2, colSpan: 2, options: colleges.filter(c => c.isActive !== false).map(c => c.name) },
    { name: 'branch', label: 'Branch', type: 'select', placeholder: 'Select department', icon: BookOpen, colSpan: 1, options: DEPARTMENTS },
    { name: 'hallTicket', label: 'Hall Ticket / Roll Number', type: 'text', placeholder: 'Enter your hall ticket', icon: CreditCard, colSpan: 1 },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', icon: Mail, colSpan: 2 },
    { name: 'mobileNumber', label: 'Mobile Number', type: 'tel', placeholder: '10-digit mobile number', icon: Phone, colSpan: 2, maxLength: 10 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-2xl mb-4">
            <GraduationCap className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Student Registration</h2>
          <p className="text-sm text-gray-500 mt-1">Create your account to take exams</p>
        </div>

        <div className="card p-8">
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-5 text-sm font-medium animate-fade-in-down">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.name} className={field.colSpan === 2 ? 'col-span-2' : ''}>
                    <label className="label">{field.label} *</label>
                    <div className="relative">
                      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      {field.type === 'select' ? (
                        <select
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          className={`input-field pl-10 ${errors[field.name] ? 'border-red-400 focus:ring-red-500' : ''}`}
                        >
                          <option value="">{field.placeholder}</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          className={`input-field pl-10 ${errors[field.name] ? 'border-red-400 focus:ring-red-500' : ''}`}
                        />
                      )}
                    </div>
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="label">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-500' : ''}`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="loading-spinner" />
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/student/login" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                Login
              </Link>
            </p>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
