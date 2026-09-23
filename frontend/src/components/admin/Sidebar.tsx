import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Book, Award, Menu, X, User, LogOut, Users, Settings, PieChart, Layers } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/admin/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'Users' },
    { to: '/admin/story-management', icon: <Book size={20} />, label: 'Collection' },
    { to: '/admin/gamification', icon: <Award size={20} />, label: 'Gamification' },
    { to: '/admin/analytics', icon: <PieChart size={20} />, label: 'Analytics' },
    { to: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden p-4 bg-white border-b border-orange-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-nestory-600 rounded-lg flex items-center justify-center text-white">
             <Layers size={18} />
           </div>
           <span className="font-bold text-gray-900">Nestory Admin</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`bg-white border-r border-orange-100 text-gray-700 w-72 min-h-screen p-6 fixed md:relative transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col shadow-sm`}
      >
        <div className="flex items-center gap-3 mb-10 px-2">
           <div className="w-10 h-10 bg-nestory-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-nestory-200">
             <Layers size={22} />
           </div>
           <div>
             <h2 className="text-xl font-bold text-gray-900 leading-tight">Nestory Admin</h2>
             <p className="text-xs text-nestory-600 font-medium">LIBRARY MANAGEMENT</p>
           </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-nestory-600 text-white shadow-md shadow-nestory-100' 
                        : 'text-gray-600 hover:bg-orange-50 hover:text-nestory-700'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className={`${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-orange-100">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50 mb-4 border border-orange-100">
            <div className="w-10 h-10 rounded-full bg-white border border-orange-200 flex items-center justify-center text-nestory-600 overflow-hidden">
               {user?.profilePicture ? (
                 <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                 <User size={20} />
               )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role === 'admin' ? 'Chief Librarian' : 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
          
        </div>
      </div>
    </>
  );
};

export default Sidebar;
