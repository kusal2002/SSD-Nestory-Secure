import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Bell, Globe, Check, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface BookTopBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

const BookTopBar: React.FC<BookTopBarProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  onSearch,
  isLoading 
}) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();
  
  return (
    <div className="flex items-center justify-between h-20 mb-10 sticky top-4 z-40 bg-transparent">
      {/* Search Input */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" 
            size={18} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
            placeholder="Search book, name, author..."
            className="w-full h-12 bg-white/50 backdrop-blur-sm border border-[#E8E2D5] rounded-2xl pl-12 pr-4 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 focus:bg-white transition-all shadow-sm"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Profile & Info Actions */}
      <div className="flex items-center gap-6">
        {/* Language Selector (Inspired by EN flag in image) */}
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E8E2D5] rounded-full hover:shadow-md transition-all">
          <span className="text-xs font-bold text-gray-700 tracking-wider">EN</span>
          <img 
            src="https://flagcdn.com/w20/gb.png" 
            srcSet="https://flagcdn.com/w40/gb.png 2x"
            width="20"
            alt="English"
            className="rounded-[2px]"
          />
        </button>

        {/* User Info Hook */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-1">
            <span className="text-sm font-black text-gray-800 leading-none mb-0.5">{user?.name || 'Reader'}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.role || 'Explorer'}</span>
          </div>
          <div className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-lg shadow-gray-200/50">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Quinn'}&backgroundColor=ffdfbf`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-[#F5F1E9] rounded-full shadow-sm"></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 text-gray-400 hover:text-rose-500 hover:bg-white rounded-2xl shadow-sm hover:shadow-md transition-all relative"
          >
            <Bell size={22} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-[#F5F1E9] rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-rose-100 divide-y divide-rose-50/50 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 flex items-center justify-between bg-rose-50/30">
                <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest">News & Alerts</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-white px-2 py-1 rounded-xl transition-colors shadow-sm"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center bg-white">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell size={24} className="text-rose-200" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 italic">"No magic messages yet..."</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id} 
                      onClick={() => markAsRead(n._id)}
                      className={`p-4 hover:bg-rose-50/50 transition-colors cursor-pointer relative group ${!n.isRead ? 'bg-rose-50/20' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          n.type === 'search_request' ? 'bg-indigo-50 text-indigo-500' : 
                          n.type === 'badge' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
                        }`}>
                          {n.type === 'search_request' ? <Info size={18} /> : <Check size={18} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-black text-slate-800 mb-1 leading-tight group-hover:text-rose-600 transition-colors">{n.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">{n.message}</p>
                          <span className="text-[9px] font-bold text-rose-300 mt-2 block uppercase tracking-widest">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {!n.isRead && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-rose-500 rounded-full border-2 border-white shadow-sm"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-white text-center">
                <button className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-rose-400 transition-colors">
                  View History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookTopBar;
