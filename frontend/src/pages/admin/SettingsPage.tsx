import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Lock, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

const AdminSettingsPage: React.FC = () => {
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

      toast.success(response.data?.message || 'Username changed successfully');
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
      toast.error('Please enter your current password');
      return;
    }

    if (!passwordForm.newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getInstance().put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success(response.data?.message || 'Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 hover:bg-orange-50 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and security</p>
        </div>
      </div>

      {/* Admin Info */}
      <div className="bg-gradient-to-br from-nestory-50 to-orange-50 rounded-3xl border-2 border-nestory-200 p-8">
        <h2 className="text-xl font-black text-gray-900 mb-6">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current Username</p>
            <p className="text-lg font-black text-gray-900">{user?.username || user?.email || 'Admin'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</p>
            <p className="text-lg font-black text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Account Role</p>
            <p className="text-lg font-black text-gray-900 capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Account Status</p>
            <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">Active</span>
          </div>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Change Username */}
        <div className="bg-white rounded-3xl border-2 border-orange-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-orange-50 flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Change Username</h3>
              <p className="text-xs text-gray-500">Update your login username</p>
            </div>
          </div>

          {!showUsernameForm ? (
            <div className="p-6">
              <button
                onClick={() => setShowUsernameForm(true)}
                className="w-full px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl border-2 border-blue-200 hover:bg-blue-100 transition-colors uppercase text-xs tracking-widest"
              >
                Change Username
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangeUsername} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  New Username
                </label>
                <input
                  type="text"
                  value={usernameForm.newUsername}
                  onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                  placeholder="Enter new username"
                  className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  Password (to confirm)
                </label>
                <input
                  type="password"
                  value={usernameForm.password}
                  onChange={(e) => setUsernameForm({ ...usernameForm, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait uppercase text-xs tracking-widest"
                >
                  {isLoading ? 'Updating...' : 'Save Username'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUsernameForm(false);
                    setUsernameForm({ newUsername: '', password: '' });
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-3xl border-2 border-orange-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-orange-50 flex items-center gap-3">
            <div className="p-3 bg-rose-50 rounded-xl">
              <Lock size={20} className="text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Change Password</h3>
              <p className="text-xs text-gray-500">Update your security password</p>
            </div>
          </div>

          {!showPasswordForm ? (
            <div className="p-6">
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full px-4 py-3 bg-rose-50 text-rose-700 font-bold rounded-xl border-2 border-rose-200 hover:bg-rose-100 transition-colors uppercase text-xs tracking-widest"
              >
                Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-medium"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-medium"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all font-medium"
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-wait uppercase text-xs tracking-widest"
                >
                  {isLoading ? 'Updating...' : 'Save Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-amber-50 rounded-3xl border-2 border-amber-200 p-8">
        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          Security Tips
        </h3>
        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="text-amber-600 font-bold">•</span>
            <span>Use a strong, unique password that you don't use elsewhere</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-600 font-bold">•</span>
            <span>Never share your password with anyone, including other admins</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-600 font-bold">•</span>
            <span>Change your password regularly (at least every 90 days)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-amber-600 font-bold">•</span>
            <span>Log out from all sessions if you suspect unauthorized access</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
