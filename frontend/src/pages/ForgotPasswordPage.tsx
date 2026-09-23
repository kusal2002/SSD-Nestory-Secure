import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Copy, Check, BookOpen, Sparkles, Heart } from 'lucide-react';
import authService from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validateEmail = () => {
    setError('');
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail()) return;

    try {
      setIsLoading(true);
      const result = await authService.forgotPassword(email);
      setResetToken(result.resetToken);
      toast.success('Password reset token generated!');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to generate reset token';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (resetToken) {
      navigator.clipboard.writeText(resetToken);
      setCopied(true);
      toast.success('Token copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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
            <Link to="/login" className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-[2rem] shadow-xl mb-8 animate-bounce-gentle hover:scale-105 transition-transform">
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
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Forgot Something?</h3>
                  <p className="text-xs font-bold text-rose-100 leading-relaxed mt-1">Don't worry, even the greatest explorers lose their way sometimes. We'll help you get back to your stories.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <Heart className="text-white" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Safe & Secure</h3>
                  <p className="text-xs font-bold text-rose-100 leading-relaxed mt-1">Your family's security is our top priority. Follow the steps to safely reset your access.</p>
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
          {resetToken ? (
            <div className="space-y-6 max-w-[360px] mx-auto w-full animate-fade-in text-left">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Token Ready!</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Use this to unlock your account
                </p>
              </div>

              <div className="bg-[#F5F1E9]/30 border-2 border-[#E8E2D5] rounded-[2rem] p-6 shadow-inner space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    Reset Token
                  </label>
                  <button
                    onClick={handleCopyToken}
                    className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-rose-500"
                    title="Copy token"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                
                <div className="bg-white border-2 border-[#E8E2D5] rounded-xl p-4 font-mono text-xs text-gray-600 break-all select-all">
                  {resetToken}
                </div>

                <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-[10px] font-black text-green-700 uppercase tracking-wider text-center">
                    Copied! Now head to the reset page.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="w-full bg-rose-500 text-white rounded-[1.5rem] py-4 font-black uppercase text-xs tracking-[0.2em] border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 shadow-[0_4px_0_rgb(190,18,60)]"
                >
                  Go to Reset Page
                </Link>

                <button
                  onClick={() => {
                    setResetToken(null);
                    setEmail('');
                  }}
                  className="w-full bg-white text-gray-500 rounded-[1.5rem] py-4 font-black uppercase text-xs tracking-[0.2em] border-2 border-[#E8E2D5] hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  Start Over
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-[360px] mx-auto w-full text-left">
              <div className="space-y-1 text-left">
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Reset Password</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Begin your journey back home
                </p>
              </div>

              {/* Email Field */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Mail size={12} className="text-rose-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full bg-[#F5F1E9]/30 border-2 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-rose-500 transition-all shadow-inner ${
                    error ? 'border-red-400 focus:border-red-500' : 'border-[#E8E2D5]'
                  }`}
                  placeholder="hello@family.com"
                  disabled={isLoading}
                />
                {error && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">
                    {error}
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
                    <ArrowLeft size={18} className="rotate-180" />
                    Get Reset Token
                  </>
                )}
              </button>

              {/* Footer Link */}
              <div className="pt-6 border-t border-[#F5F1E9] text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Remember your password?{' '}
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

export default ForgotPasswordPage;

