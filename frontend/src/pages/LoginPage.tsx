import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Sparkles, BookOpen, Heart } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    setFormError('');

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login(formData);
      toast.success('Welcome back to Nestory!');
      navigate('/');
    } catch (error: any) {
      const backendErrors = error?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};
        backendErrors.forEach((item: any) => {
          if (item?.field && item?.message) {
            fieldErrors[item.field] = item.message;
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      }

      let errorMessage = error?.response?.data?.message || 'Login failed. Please try again.';
      if (errorMessage === 'Invalid credentials') {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      }
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center p-4 font-sans selection:bg-rose-200 selection:text-rose-900">
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row bg-white rounded-[3rem] border-2 border-[#E8E2D5] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden animate-fade-in">
        
        {/* Left Side: Brand & Info */}
        <div className="w-full md:w-1/2 bg-rose-500 p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-700/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-[2rem] shadow-xl mb-8 animate-bounce-gentle">
              <BookOpen className="text-rose-500" size={32} />
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-2">
              Nes<span className="text-rose-200">tory</span>
            </h1>
            <p className="text-xs font-black text-rose-100 uppercase tracking-[0.3em] mb-12">
              Family Reading Adventure
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Gamified Progress</h3>
                  <p className="text-xs font-bold text-rose-100 leading-relaxed mt-1">Earn badges and points while exploring thousands of magical stories together.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <Heart className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Family Driven</h3>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Safe Space</h3>
                  <p className="text-xs font-bold text-rose-100 leading-relaxed mt-1">A curated environment where children can read safely and parents can monitor growth.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 mt-auto">
            <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest italic opacity-80">
              "Reading is a passport to countless adventures."
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white relative">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-[360px] mx-auto w-full">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Welcome Back</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Continue your family's journey
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Mail size={12} className="text-rose-500" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-[#F5F1E9]/30 border-2 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-rose-500 transition-all shadow-inner ${
                  errors.email ? 'border-red-400 focus:border-red-500' : 'border-[#E8E2D5]'
                }`}
                placeholder="hello@family.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Lock size={12} className="text-rose-500" />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full bg-[#F5F1E9]/30 border-2 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-rose-500 transition-all shadow-inner ${
                  errors.password ? 'border-red-400 focus:border-red-500' : 'border-[#E8E2D5]'
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">
                  {errors.password}
                </p>
              )}
            </div>

            {formError && (
              <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-wide leading-relaxed">
                  {formError}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end px-1">
              <Link
                to="/forgot-password"
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
              >
                Forgot password?
              </Link>
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
                  <LogIn size={18} />
                  Continue Adventure
                </>
              )}
            </button>

            {/* Footer Link */}
            <div className="pt-6 border-t border-[#F5F1E9] text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                New to our story?{' '}
                <Link to="/register" className="text-rose-500 hover:text-rose-600 transition-colors ml-1">
                  Start here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
