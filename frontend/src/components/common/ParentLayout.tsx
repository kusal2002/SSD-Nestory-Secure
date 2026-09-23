import React from 'react';
import { Outlet } from 'react-router-dom';
import ParentSidebar from './ParentSidebar';
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';

const ParentLayout: React.FC = () => {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = React.useState(0);

  React.useEffect(() => {
    const fetchUnread = async () => {
      try {
        const count = await chatService.getUnread();
        setUnreadMessages(count);
      } catch (error) {
        console.error('Failed to fetch unread messages:', error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <ParentSidebar unreadMessages={unreadMessages} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default ParentLayout;