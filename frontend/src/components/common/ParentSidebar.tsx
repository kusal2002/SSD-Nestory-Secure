import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Book, 
  TrendingUp, 
  Users, 
  Settings, 
  BarChart3, 
  MessageCircle, 
  Plus, 
  Sparkles,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  onAddChild?: () => void;
  onNewAssignment?: () => void;
  unreadMessages?: number;
}

const ParentSidebar: React.FC<SidebarProps> = ({ onAddChild, onNewAssignment, unreadMessages = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/parent-dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/stories', icon: <Book size={20} />, label: 'Browse Stories' },
    { to: '/assignments', icon: <TrendingUp size={20} />, label: 'Manage Assignments' },
    { to: '/progress', icon: <BarChart3 size={20} />, label: 'Reading Progress' },
    { to: '/gamification', icon: <Gamepad2 size={20} />, label: 'Gamification' },
    { to: '/chat', icon: <MessageCircle size={20} />, label: 'Family Chat', badge: unreadMessages },
    { to: '/family-settings', icon: <Users size={20} />, label: 'Family Settings' },
    { to: '/account-settings', icon: <Settings size={20} />, label: 'Account Settings' },
  ];

  const quickActions = [
    { 
      label: 'Add Child', 
      icon: <Plus size={18} />, 
      onClick: () => {
        if (onAddChild) onAddChild();
        else navigate('/parent-dashboard?action=add-child');
        setIsOpen(false);
      },
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    },
    { 
      label: 'New Assignment', 
      icon: <Book size={18} />, 
      onClick: () => {
        if (onNewAssignment) onNewAssignment();
        else navigate('/stories');
        setIsOpen(false);
      },
      color: 'bg-green-50 text-green-600 hover:bg-green-100'
    }
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-nestory-600 rounded-lg flex items-center justify-center text-white">
            <Home size={18} />
          </div>
          <span className="font-bold text-gray-900 italic">Nestory</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo Section */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-nestory-500 to-nestory-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-nestory-100">
              <Home size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight italic">Nestory</h2>
              <p className="text-[10px] text-nestory-600 font-bold tracking-widest uppercase">Parent Portal</p>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-8 px-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Quick Actions</p>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${action.color}`}
                >
                  <span className="p-1 bg-white/50 rounded-lg shadow-sm">
                    {action.icon}
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Menu</p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? 'bg-nestory-50 text-nestory-700 shadow-sm' 
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`transition-colors duration-200 ${isActive ? 'text-nestory-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {item.icon}
                        </span>
                        <span className="font-semibold text-sm">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="mt-auto p-6 border-t border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm mb-4">
            <div className="w-10 h-10 rounded-full bg-nestory-50 border border-nestory-100 flex items-center justify-center text-nestory-600 overflow-hidden ring-2 ring-white">
               {user?.avatar ? (
                 <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                 <User size={20} />
               )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Parent'}</p>
              <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-tight">Family Guardian</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/account-settings')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all duration-200 w-full font-semibold text-sm group mb-2"
          >
            <Settings size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
            Account Settings
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-gray-500 hover:text-red-600 transition-all duration-200 w-full font-semibold text-sm group"
          >
            <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Spacer for desktop to push content */}
      <div className="hidden lg:block lg:w-72 flex-shrink-0" />
      {/* Spacer for mobile fixed header */}
      <div className="lg:hidden h-16 w-full" />
    </>
  );
};

export default ParentSidebar;