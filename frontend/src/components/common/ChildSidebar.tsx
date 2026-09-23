import React from 'react';
import { Home, History, BookMarked, LayoutGrid, MessageCircle, LogOut, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ChildSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, path: '/child/dashboard', label: 'Home' },
    { icon: History, path: '/child/progress', label: 'My Books' },
    { icon: LayoutGrid, path: '/child/gamification', label: 'Awards' },
    { icon: MessageCircle, path: '/child/chat', label: 'Chat' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-20 bg-[#F5F1E9] border-r border-[#E8E2D5] flex flex-col items-center py-8 z-50">
      <div className="mb-12">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#E8E2D5]">
          <span className="text-2xl">📖</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-6">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`p-3 rounded-2xl transition-all group relative ${
                isActive 
                  ? 'bg-white text-rose-500 shadow-md border border-[#E8E2D5]' 
                  : 'text-gray-400 hover:text-rose-400 hover:bg-white/50'
              }`}
            >
              <item.icon size={24} />
              <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-6">
        <button 
           onClick={() => navigate('/child/settings')}
           className="p-3 rounded-2xl text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all"
        >
          <Settings size={24} />
        </button>
        <button 
          onClick={() => logout()}
          className="p-3 rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
        >
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
};

export default ChildSidebar;
