import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function AdminForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email, role: 'admin' });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp, role: 'admin' });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword, role: 'admin' });
      setSuccess(true);
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-in-up">
          <div className="card p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-2xl mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful</h2>
            <p className="text-sm text-gray-500 mb-6">Redirecting to login...</p>
            <Link to="/admin/login" className="btn-primary">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  const stepTitle = step === 1 ? 'Reset Password' : step === 2 ? 'Verify OTP' : 'New Password';
  const stepSubtitle = step === 1 ? 'Enter your email to receive an OTP' : step === 2 ? 'Enter the OTP sent to your email' : 'Set your new password';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-2xl mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{stepTitle}</h2>
          <p className="text-sm text-gray-500 mt-1">{stepSubtitle}</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-5 text-sm font-medium animate-fade-in-down">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="loading-spinner" />
                    Sending OTP...
                  </>
                ) : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="label">OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="Enter OTP"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="loading-spinner" />
                    Verifying...
                  </>
                ) : 'Verify OTP'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter password"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="loading-spinner" />
                    Resetting...
                  </>
                ) : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center space-y-2">
            {step > 1 && (
              <button onClick={() => { setStep(step - 1); setError(''); }} className="text-sm text-primary-600 font-medium hover:text-primary-700">
                Back
              </button>
            )}
            <Link to="/admin/login" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
