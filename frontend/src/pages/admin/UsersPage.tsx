import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../services/apiClient';
import UsersTable from '../../components/admin/UsersTable';
import { User } from '../../types';
import { UserPlus, Download, Filter, Search } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getInstance().get('/auth/users');
        setUsers(response.data.data || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserDeleted = (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(u => (u.id || u.email) !== userId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Users Directory</h1>
          <p className="text-gray-500 font-medium">Manage and monitor all accounts across the platform</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-100 text-gray-700 font-bold rounded-xl hover:bg-orange-50 transition-colors shadow-sm">
            <Download size={18} />
            Export
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-nestory-600 text-white font-bold rounded-xl hover:bg-nestory-700 transition-all shadow-lg shadow-nestory-100">
            <UserPlus size={18} />
            Create User
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-orange-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-orange-50/50 border border-orange-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-nestory-200 transition-all text-sm font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-gray-600 font-bold hover:bg-orange-50 rounded-xl transition-colors">
          <Filter size={18} />
          Filters
        </button>
        <div className="h-6 w-px bg-orange-100 mx-2 hidden md:block"></div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Role:</span>
          <select className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none cursor-pointer">
            <option>All Roles</option>
            <option>Admin</option>
            <option>Parent</option>
            <option>Child</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-orange-100 shadow-sm overflow-hidden">
        <UsersTable users={filteredUsers} isLoading={isLoading} onUserDeleted={handleUserDeleted} />
      </div>
    </div>
  );
};

export default UsersPage;
