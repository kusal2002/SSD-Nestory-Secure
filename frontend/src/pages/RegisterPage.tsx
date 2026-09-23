import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Lock, UserPlus, BookOpen, Star, ShieldCheck } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'parent' as 'parent' | 'admin',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    setFormError('');

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      toast.success('Registration successful! Welcome to the family!');
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

      const errorMessage = error?.response?.data?.message || 'Registration failed. Please try again.';
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center p-4 font-sans selection:bg-rose-200 selection:text-rose-900">
      <div className="w-full max-w-[1100px] flex flex-col md:flex-row bg-white rounded-[3rem] border-2 border-[#E8E2D5] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden animate-fade-in my-8">
        
        {/* Left Side: Brand & Info */}
        <div className="w-full md:w-5/12 bg-rose-500 p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-rose-700/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-[2rem] shadow-xl mb-8">
              <BookOpen className="text-rose-500" size={32} />
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-2">
              Nes<span className="text-rose-200">tory</span>
            </h1>
            <p className="text-xs font-black text-rose-100 uppercase tracking-[0.3em] mb-12">
              Join the Reading Community
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <Star className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Unlock Potential</h3>
                  <p className="text-xs font-bold text-rose-100 leading-relaxed mt-1">Every book read is a new skill learned and a new world discovered.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <ShieldCheck className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Parental Peace</h3>
                  <p className="text-xs font-bold text-rose-100 leading-relaxed mt-1">Full control over assignments and reading progress with detailed analytics.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="flex -space-x-3 mb-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-rose-500 bg-rose-200 flex items-center justify-center text-[10px] font-black text-rose-600">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-rose-500 bg-white flex items-center justify-center text-[10px] font-black text-rose-500">
                +1k
              </div>
            </div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest">
              Join 1,000+ happy families
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 p-12 flex flex-col justify-center bg-white relative">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-[500px] mx-auto w-full">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Create Account</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Start your family adventure today
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <User size={12} className="text-rose-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-[#F5F1E9]/30 border-2 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-rose-500 transition-all shadow-inner ${
                    errors.name ? 'border-red-400 focus:border-red-500' : 'border-[#E8E2D5]'
                  }`}
                  placeholder="The Storyteller"
                  disabled={isLoading}
                />
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
                  placeholder="hello@adventure.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <ShieldCheck size={12} className="text-rose-500" />
                  Confirm
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-[#F5F1E9]/30 border-2 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-rose-500 transition-all shadow-inner ${
                    errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-[#E8E2D5]'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            {(errors.name || errors.email || errors.password || errors.confirmPassword) && (
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 bg-red-50 p-2 rounded-lg">
                Please check all fields
              </p>
            )}

            {formError && (
              <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-wide leading-relaxed">
                  {formError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-rose-500 text-white rounded-[1.5rem] py-4 font-black uppercase text-xs tracking-[0.15em] border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_4px_0_rgb(190,18,60)]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                   <UserPlus size={18} />
                   Create My Nest
                </>
              )}
            </button>

            <div className="pt-6 border-t border-[#F5F1E9] text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Already a member?{' '}
                <Link to="/login" className="text-rose-500 hover:text-rose-600 transition-colors ml-1">
                  Log in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
