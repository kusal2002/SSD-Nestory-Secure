import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Menu, X, Bell, User as UserIcon, Sparkles, Check, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface NavbarProps {
  title?: string;
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title = 'Nestory', onMenuClick }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-[#FDFCFB]/80 backdrop-blur-md border-b border-amber-500/10 sticky top-0 z-[100] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Mobile Menu & Breadcrumb Style Title */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              onMenuClick?.();
            }}
            className="lg:hidden p-3 bg-white border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 rounded-2xl transition-all active:scale-95"
          >
            {isOpen ? <X size={20} className="text-slate-600" /> : <Menu size={20} className="text-slate-600" />}
          </button>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none mb-1">
              {user?.role === 'admin' ? 'Admin Controller' : 'Portal'}
            </span>
            <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="hidden sm:inline">🚀</span> {title}
            </div>
          </div>
        </div>

        {/* Right: Premium User Actions */}
        <div className="flex items-center gap-2 sm:gap-4 bg-white/50 p-1.5 rounded-[1.25rem] border border-white/80 shadow-sm backdrop-blur-sm relative">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="hidden sm:flex p-2.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all group relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white ring-1 ring-orange-500/20"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 divide-y divide-slate-50 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell size={20} className="text-slate-300" />
                      </div>
                      <p className="text-xs font-medium text-slate-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n._id} 
                        onClick={() => markAsRead(n._id)}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-amber-50/30' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'search_request' ? 'bg-blue-100 text-blue-600' : 
                            n.type === 'badge' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {n.type === 'search_request' ? <Info size={16} /> : <Check size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 mb-0.5">{n.title}</p>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.message}</p>
                            <span className="text-[9px] font-medium text-slate-400 mt-2 block uppercase tracking-tight">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {!n.isRead && (
                          <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-slate-100 hidden sm:block mx-1"></div>

          {/* User Profile Hook */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-50 rounded-2xl shadow-sm group cursor-default">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
              <UserIcon size={20} strokeWidth={2.5} />
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-black text-slate-900 leading-none mb-0.5">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1.5">
                <Sparkles size={10} className="text-amber-500 animate-pulse" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{user?.role || 'Member'}</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2.5 bg-slate-900 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-90 group"
            title="Logout"
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
      
      {/* Decorative Bottom Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-200 to-transparent opacity-30"></div>
    </nav>
  );
};

export default Navbar;
