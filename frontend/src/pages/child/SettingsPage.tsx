import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Lock, ShieldCheck, Sparkle, User } from "lucide-react";
import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";
import authService from "../../services/authService";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../contexts/AuthContext";

const ChildAccountSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Username form
  const [usernameForm, setUsernameForm] = useState({
    newUsername: '',
    password: ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usernameForm.newUsername.trim()) {
      toast.error('Please enter a new username');
      return;
    }

    if (!usernameForm.password.trim()) {
      toast.error('Please enter your password to confirm');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getInstance().put('/auth/change-username', {
        newUsername: usernameForm.newUsername,
        password: usernameForm.password
      });

      toast.success(response.data?.message || 'Username changed successfully! 🎉');
      setUsernameForm({ newUsername: '', password: '' });
      setShowUsernameForm(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to change username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword.trim()) {
      toast.error('Please enter your current secret code');
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      toast.error('Please enter a new secret code');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Secret code must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Secret codes do not match');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getInstance().put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success(response.data?.message || 'Secret code updated! 🔐');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to change secret code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] pl-20 pb-12 transition-all duration-500">
      <ChildSidebar />
      <div className="max-w-[1400px] mx-auto px-10 pt-4">
        <BookTopBar searchQuery="" setSearchQuery={() => {}} onSearch={() => {}} />

        <div className="flex items-center gap-4 mb-10">
           <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl border border-[#E8E2D5] hover:bg-rose-50 transition-colors text-gray-600 shadow-sm active:scale-95">
              <ArrowLeft size={20} />
           </button>
           <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">My Settings ⚙️</h1>
        </div>

        <div className="space-y-8">
          {/* Account Info Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[3rem] border-3 border-purple-200 p-8 shadow-lg">
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">👤</span>
              My Account
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/70 rounded-2xl p-4 border-2 border-purple-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Your Name</p>
                <p className="text-xl font-black text-gray-900">{user?.name || 'Young Reader'}</p>
              </div>
              <div className="bg-white/70 rounded-2xl p-4 border-2 border-purple-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Email</p>
                <p className="text-lg font-bold text-gray-800 break-all">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Change Username Card */}
            <div className="bg-white rounded-[3rem] border-3 border-blue-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6 border-b-3 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-3">
                <div className="p-4 bg-blue-100 rounded-2xl">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Change Username</h3>
                  <p className="text-xs text-gray-600 font-bold">Pick a new cool username! 😎</p>
                </div>
              </div>

              {!showUsernameForm ? (
                <div className="p-6">
                  <button
                    onClick={() => setShowUsernameForm(true)}
                    className="w-full px-4 py-4 bg-blue-100 text-blue-700 font-black rounded-2xl border-3 border-blue-300 hover:bg-blue-200 transition-all uppercase text-sm tracking-widest active:scale-95"
                  >
                    ✏️ Change Username
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChangeUsername} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">
                      📝 New Username
                    </label>
                    <input
                      type="text"
                      value={usernameForm.newUsername}
                      onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                      placeholder="Enter new username..."
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-bold text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">
                      🔐 Your Secret Code (to confirm)
                    </label>
                    <input
                      type="password"
                      value={usernameForm.password}
                      onChange={(e) => setUsernameForm({ ...usernameForm, password: e.target.value })}
                      placeholder="Enter your secret code..."
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-bold text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-wait uppercase text-xs tracking-widest active:scale-95 border-2 border-blue-700"
                    >
                      {isLoading ? '⏳ Saving...' : '✅ Save Username'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUsernameForm(false);
                        setUsernameForm({ newUsername: '', password: '' });
                      }}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-black rounded-2xl hover:bg-gray-300 transition-all disabled:opacity-50 uppercase text-xs tracking-widest active:scale-95"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-[3rem] border-3 border-rose-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6 border-b-3 border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50 flex items-center gap-3">
                <div className="p-4 bg-rose-100 rounded-2xl">
                  <ShieldCheck size={24} className="text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Change Secret Code</h3>
                  <p className="text-xs text-gray-600 font-bold">Make your code even stronger! 💪</p>
                </div>
              </div>

              {!showPasswordForm ? (
                <div className="p-6">
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full px-4 py-4 bg-rose-100 text-rose-700 font-black rounded-2xl border-3 border-rose-300 hover:bg-rose-200 transition-all uppercase text-sm tracking-widest active:scale-95"
                  >
                    🔐 Change Secret Code
                  </button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">
                      🔑 Current Secret Code
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current secret code..."
                      className="w-full px-4 py-3 border-2 border-rose-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-bold text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">
                      🆕 New Secret Code
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new secret code (min 6 characters)..."
                      className="w-full px-4 py-3 border-2 border-rose-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-bold text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">
                      ☑️ Confirm Secret Code
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new secret code..."
                      className="w-full px-4 py-3 border-2 border-rose-200 rounded-2xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-bold text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all disabled:opacity-50 disabled:cursor-wait uppercase text-xs tracking-widest active:scale-95 border-2 border-rose-700"
                    >
                      {isLoading ? '⏳ Saving...' : '✅ Save Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-black rounded-2xl hover:bg-gray-300 transition-all disabled:opacity-50 uppercase text-xs tracking-widest active:scale-95"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Security Tips Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[3rem] border-3 border-amber-300 p-8 shadow-lg">
            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-4xl">🛡️</span>
              Stay Safe Online!
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/70 rounded-2xl p-4 border-2 border-amber-200">
                <p className="font-black text-sm text-amber-900">🔐 Make your code strong</p>
                <p className="text-xs text-gray-700 mt-1">Mix letters, numbers & symbols!</p>
              </div>
              <div className="bg-white/70 rounded-2xl p-4 border-2 border-amber-200">
                <p className="font-black text-sm text-amber-900">🤫 Keep it secret</p>
                <p className="text-xs text-gray-700 mt-1">Don't tell anyone your code!</p>
              </div>
              <div className="bg-white/70 rounded-2xl p-4 border-2 border-amber-200">
                <p className="font-black text-sm text-amber-900">🔄 Change it often</p>
                <p className="text-xs text-gray-700 mt-1">Update every few months!</p>
              </div>
              <div className="bg-white/70 rounded-2xl p-4 border-2 border-amber-200">
                <p className="font-black text-sm text-amber-900">👨‍👩‍👧 Tell your parents</p>
                <p className="text-xs text-gray-700 mt-1">If something feels wrong!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildAccountSettingsPage;
