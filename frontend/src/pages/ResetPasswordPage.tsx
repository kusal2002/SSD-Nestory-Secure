import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Lock, ArrowLeft, Eye, EyeOff, BookOpen, Sparkles, Heart } from 'lucide-react';
import authService from '../services/authService';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!token) {
      newErrors.token = 'Reset token is missing';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const authResponse = await authService.resetPassword(token, formData.newPassword);
      
      if (authResponse.token && authResponse.user) {
        authService.setToken(authResponse.token, authResponse.user);
        try {
          await login({ 
            email: authResponse.user.email, 
            password: formData.newPassword 
          });
        } catch {
          // If login fails, still navigate since token is valid
          localStorage.setItem('token', authResponse.token);
          localStorage.setItem('user', JSON.stringify(authResponse.user));
        }
      }

      toast.success('Password reset successfully!');
      navigate(authResponse.user?.role === 'child' ? '/child' : '/');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to reset password';
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center p-4 font-sans selection:bg-rose-200 selection:text-rose-900">
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row bg-white rounded-[3rem] border-2 border-[#E8E2D5] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden animate-fade-in text-left">
        
        {/* Left Side: Brand & Info */}
        <div className="w-full md:w-1/2 bg-rose-500 p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-700/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <Link to="/login" className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-[2rem] shadow-xl mb-8 animate-bounce-gentle hover:scale-105 transition-transform text-left">
              <BookOpen className="text-rose-500" size={32} />
            </Link>
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-2">
              Nes<span className="text-rose-200">tory</span>
            </h1>
            <p className="text-xs font-black text-rose-100 uppercase tracking-[0.3em] mb-12 text-left">
              Family Reading Adventure
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">New Beginning</h3>
                  <p className="text-xs font-bold text-rose-100 leading-relaxed mt-1">Choose a safe and memorable password for your next adventure.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <Heart className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Family Driven</h3>
                  <p className="text-xs font-bold text-rose-100 leading-relaxed mt-1">A curated environment where children can read safely and parents can monitor growth.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 mt-auto text-left">
            <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest italic opacity-80">
              "Every story deserves a beautiful middle and an even better ending."
            </p>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white relative">
          {!token ? (
            <div className="space-y-6 max-w-[360px] mx-auto w-full animate-fade-in text-left">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Missing Token</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Generate a new one to continue
                </p>
              </div>

              <div className="bg-[#F5F1E9]/30 border-2 border-[#E8E2D5] rounded-3xl p-8 space-y-4 shadow-inner text-center">
                <p className="text-sm font-bold text-gray-600">No reset token found or it might have expired.</p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/forgot-password"
                  className="w-full bg-rose-500 text-white rounded-[1.5rem] py-4 font-black uppercase text-xs tracking-[0.2em] border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 shadow-[0_4px_0_rgb(190,18,60)]"
                >
                  Generate Reset Token
                </Link>

                <Link
                  to="/login"
                  className="w-full bg-white text-gray-500 rounded-[1.5rem] py-4 font-black uppercase text-xs tracking-[0.2em] border-2 border-[#E8E2D5] hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-[360px] mx-auto w-full text-left">
              <div className="space-y-1 text-left">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Reset Password</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Create your new access key
                </p>
              </div>

              {errors.form && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-wide leading-relaxed">
                    {errors.form}
                  </p>
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Lock size={12} className="text-rose-500" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`w-full bg-[#F5F1E9]/30 border-2 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-rose-500 transition-all shadow-inner ${
                      errors.newPassword ? 'border-red-400 focus:border-red-500' : 'border-[#E8E2D5]'
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Lock size={12} className="text-rose-500" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full bg-[#F5F1E9]/30 border-2 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-rose-500 transition-all shadow-inner ${
                      errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-[#E8E2D5]'
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-rose-500 text-white rounded-[1.5rem] py-4 font-black uppercase text-xs tracking-[0.2em] border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_4px_0_rgb(190,18,60)]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Lock size={18} />
                    Secure Account
                  </>
                )}
              </button>

              {/* Footer Link */}
              <div className="pt-6 border-t border-[#F5F1E9] text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Nevermind?{' '}
                  <Link to="/login" className="text-rose-500 hover:text-rose-600 transition-colors ml-1 uppercase">
                    Back to Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

