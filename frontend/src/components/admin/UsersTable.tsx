import React, { useState } from 'react';
import { User } from '../../types';
import { Mail, Shield, User as UserIcon, Calendar, Trash2, Edit2, Eye, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient';

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  onUserDeleted?: (userId: string) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, isLoading, onUserDeleted }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(userId);
      await apiClient.getInstance().delete(`/auth/users/${userId}`);
      toast.success(`User "${userName}" deleted successfully`);
      if (onUserDeleted) {
        onUserDeleted(userId);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };
  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-50 rounded-2xl border border-orange-50 w-full" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-200 mb-4">
          <UserIcon size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No users found</h3>
        <p className="text-gray-500 max-w-xs mt-2">Adjust your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-orange-50/30 border-b border-orange-100/50">
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">User Profile</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Role & Security</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Join Date</th>
            <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-orange-50">
          {users.map((user) => (
            <tr key={user.id || user.email || Math.random()} className="hover:bg-orange-50/20 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-nestory-200 to-orange-100 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{user.name}</h4>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Mail size={12} className="text-nestory-400" />
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  <Shield size={10} />
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    user.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {user.isActive !== false ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {user.isActive !== false ? 'Verified' : 'Banned'}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                  <Calendar size={12} className="text-gray-400" />
                  {new Date(user.createdAt || '').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </td>
              <td className="px-6 py-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button 
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all"
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-nestory-600 hover:bg-orange-50 border border-transparent hover:border-orange-100 rounded-xl transition-all"
                    title="Edit user"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id || user.email || '', user.name || 'User')}
                    disabled={deletingId === (user.id || user.email)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
