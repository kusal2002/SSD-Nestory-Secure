import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Search, Bell, ChevronRight, Check, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications();
  
  // Format breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(p => p && p !== 'admin');
  const currentPage = pathParts.length > 0 ? pathParts[pathParts.length - 1].replace(/-/g, ' ') : 'Dashboard';

  return (
    <div className="flex h-screen bg-[#fafaf9] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header/Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-orange-100 flex items-center justify-between px-8 z-10 sticky top-0 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span className="hover:text-nestory-600 transition-colors cursor-pointer">Admin</span>
              <ChevronRight size={12} className="mx-1 opacity-50" />
              <span className="text-gray-900">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl bg-white border border-orange-100 text-gray-400 hover:text-nestory-600 hover:bg-orange-50 transition-all relative group"
              >
                <Bell size={20} className="group-hover:rotate-12 transition-transform duration-200" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full shadow-sm shadow-rose-400 animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 divide-y divide-slate-50 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Alerts Center</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-nestory-600 hover:text-nestory-700 bg-nestory-50 px-2 py-1 rounded-lg transition-colors"
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
                        <p className="text-xs font-medium text-slate-500 italic">No magic alerts for now</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n._id} 
                          onClick={() => {
                            markAsRead(n._id);
                            // Optional: navigate to specific page if needed
                          }}
                          className={`p-4 hover:bg-indigo-50/10 transition-colors cursor-pointer relative group border-l-4 ${!n.isRead ? 'bg-amber-50/30 border-amber-400' : 'border-transparent'}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              n.type === 'search_request' ? 'bg-blue-100 text-blue-600' : 
                              n.type === 'badge' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {n.type === 'search_request' ? <Info size={16} /> : <Check size={16} />}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900 mb-0.5 line-clamp-1 group-hover:text-nestory-600 transition-colors">{n.title}</p>
                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">{n.message}</p>
                              <span className="text-[9px] font-bold text-slate-400 mt-2 block uppercase tracking-tight">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          {!n.isRead && (
                            <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-orange-500 rounded-full ring-2 ring-white"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 bg-white text-center border-t border-slate-50">
                      <button className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-nestory-400 transition-colors">
                        Notification History
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth">
          <div className="max-w-[1400px] mx-auto space-y-8">
             <Outlet />
          </div>
          
          <footer className="mt-20 py-8 border-t border-orange-50 text-center">
            <p className="text-xs text-gray-400 font-medium tracking-wide">
              POWERED BY NESTORY CORE ENGINE V2.4 • BUILT FOR EDUCATION
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
