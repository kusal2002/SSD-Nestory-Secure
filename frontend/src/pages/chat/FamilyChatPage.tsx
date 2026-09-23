import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageCircle, Send, Users, Trash2, Rocket } from 'lucide-react';
import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";
import { useAuth } from '../../contexts/AuthContext';
import chatService from '../../services/chatService';
import { ChatGroupSummary, ChatMessage } from '../../types';

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const FamilyChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [group, setGroup] = useState<ChatGroupSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);
  const joinedRef = useRef(false);

  const myRole = user?.role || 'parent';
  const isParent = myRole === 'parent';

  const load = async () => {
    setLoading(true);
    try {
      const [groupData, rows] = await Promise.all([
        chatService.getMyGroup(),
        chatService.getMessages(80),
      ]);
      setGroup(groupData);
      setMessages(rows);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as any).response?.data?.message
          : 'Failed to load chat';
      toast.error(message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const unreadFromOthers = useMemo(
    () =>
      messages
        .filter((m) => (m.senderRole || '').toLowerCase() !== myRole)
        .map((m) => m.id),
    [messages, myRole]
  );

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIncoming = useCallback((payload: { message?: ChatMessage }) => {
    if (!payload?.message) return;
    const msg = payload.message;
    setMessages((prev) => {
      if (prev.some((item) => item.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const handleTyping = useCallback((payload: { name?: string; userId?: string; isTyping?: boolean }) => {
    if (!payload?.name) return;
    setTypingUsers((prev) => {
      if (payload.isTyping) {
        return prev.includes(payload.name!) ? prev : [...prev, payload.name!];
      }
      return prev.filter((name) => name !== payload.name);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = chatService.connectSocket(token);
    socketRef.current = socket;

    const onConnect = () => {
      socket.emit('chat:join', {}, (ack: any) => {
        if (ack?.ok) joinedRef.current = true;
      });
    };

    socket.on("connect", onConnect);
    socket.on("chat:new-message", handleIncoming);
    socket.on("chat:typing", handleTyping);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("chat:new-message", handleIncoming);
      socket.off("chat:typing", handleTyping);
    };
  }, [token, handleIncoming, handleTyping]);

  useEffect(() => {
    if (unreadFromOthers.length) chatService.markRead(unreadFromOthers).catch(() => {});
  }, [unreadFromOthers]);

  const notifyTyping = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:typing', { isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('chat:typing', { isTyping: false });
    }, 1200);
  }, []);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    try {
      setSending(true);
      const created = await chatService.sendMessage(content);
      setMessages((prev) => prev.some(m => m.id === created.id) ? prev : [...prev, created]);
      setNewMessage('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear all messages?')) return;
    try {
      setClearing(true);
      await chatService.clearChat();
      setMessages([]);
      toast.success('Chat cleared');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to clear chat');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className={`min-h-screen ${isParent ? "bg-white" : "bg-[#F5F1E9] pl-20 transition-colors duration-500"}`}>
      {!isParent && <ChildSidebar />}
      
      <div className={`max-w-[1400px] mx-auto ${isParent ? "px-4 sm:px-6 lg:px-8 py-8" : "px-10 pt-4"}`}>
        {!isParent && <BookTopBar searchQuery="" setSearchQuery={() => {}} onSearch={() => {}} />}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 mt-6">
          <div className="flex items-center gap-4">
            {!isParent && (
              <button 
                onClick={() => navigate("/child")} 
                className="p-3 bg-white rounded-2xl border border-[#E8E2D5] hover:bg-rose-50 transition-colors shadow-sm active:scale-95"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-black text-gray-800 tracking-tight uppercase ${isParent ? "text-4xl md:text-5xl" : ""}`}>
                Family <span className="text-rose-500">Chat</span>
              </h1>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
                {isParent ? "Coordinate and celebrate reading together." : "Talk to your family and share your progress!"}
              </p>
            </div>
          </div>
          
          {isParent && (
            <button
              onClick={handleClearChat}
              disabled={clearing || messages.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest border border-rose-100 hover:bg-rose-100 transition-all disabled:opacity-50"
            >
              <Trash2 size={16} />
              Clear History
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Members Sidebar (Both but styled differently) */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-[#E8E2D5] shadow-sm">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Users size={18} className="text-rose-500" />
                Family Team
              </h2>
              <div className="space-y-4">
                {group?.members?.map((member: any) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border-[#F5F1E9] hover:bg-[#F5F1E9]/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center font-black text-rose-500 border border-rose-200 group-hover:scale-110 transition-transform">
                      {member?.displayName?.charAt(0) || 'E'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-800 truncate uppercase">{member?.displayName || 'Family Member'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{member?.role || 'Member'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
               <div className="relative z-10">
                 <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-2">Chat Stats</p>
                 <div className="flex items-baseline gap-2">
                   <p className="text-4xl font-black">{messages.length}</p>
                   <span className="text-xs font-bold opacity-60">Messages</span>
                 </div>
                 <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                    <Rocket size={16} className="text-rose-400" />
                    <p className="text-xs font-bold leading-relaxed opacity-80 italic">
                      Reading together is a superpower!
                    </p>
                 </div>
               </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="xl:col-span-3 flex flex-col gap-6">
            <div className="bg-white rounded-[2.5rem] border border-[#E8E2D5] shadow-sm flex flex-col h-[65vh] relative overflow-hidden">
               {/* Messages List */}
               <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                       <div className="w-20 h-20 bg-[#F5F1E9] rounded-3xl flex items-center justify-center border border-[#E8E2D5]">
                         <MessageCircle className="text-gray-400" size={32} />
                       </div>
                       <div>
                         <p className="text-lg font-black text-gray-800 uppercase tracking-tight">Quiet in here!</p>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Send a message to start the fun.</p>
                       </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, idx) => {
                        const isMine = message.senderUser === user?.id;
                        const isSystem = message.senderRole === 'system';

                        if (isSystem) {
                          return (
                            <div key={message.id || idx} className="flex justify-center">
                              <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200 shadow-sm text-center">
                                {message.content}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div key={message.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[80%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                              {!isMine && (
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">{message.senderName}</p>
                              )}
                              <div className={`px-6 py-4 rounded-[2rem] border-2 shadow-sm relative ${
                                isMine 
                                  ? 'bg-rose-500 border-rose-600 text-white rounded-tr-none' 
                                  : 'bg-white border-[#E8E2D5] text-gray-800 rounded-tl-none'
                              }`}>
                                <p className="text-sm font-bold leading-relaxed">{message.content}</p>
                                <div className={`absolute bottom-1 right-3 text-[8px] font-black uppercase opacity-60 ${isMine ? 'text-white' : 'text-gray-400'}`}>
                                  {formatTime(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={endRef} />
                    </>
                  )}
               </div>

               {/* Typing Indicator */}
               {typingUsers.length > 0 && (
                 <div className="absolute bottom-24 left-8 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-[#E8E2D5] shadow-sm animate-bounce">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{typingUsers[0]} is thinking...</span>
                 </div>
               )}

               {/* Input Area */}
               <div className="p-6 bg-[#F5F1E9]/30 border-t border-[#E8E2D5]">
                  <div className="flex gap-3 relative">
                    <input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        notifyTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a playful message..."
                      className="flex-1 bg-white border-2 border-[#E8E2D5] rounded-3xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      className="bg-rose-500 p-4 rounded-3xl text-white border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:border-b-4"
                    >
                      <Send size={20} />
                    </button>
                    <div className="absolute -top-12 right-0 flex gap-2">
                       <button onClick={() => setNewMessage(p => p + ' 👋')} className="px-3 py-1.5 bg-white border-2 border-[#E8E2D5] rounded-xl text-lg hover:scale-110 transition-transform shadow-sm font-bold">👋</button>
                       <button onClick={() => setNewMessage(p => p + ' 📖')} className="px-3 py-1.5 bg-white border-2 border-[#E8E2D5] rounded-xl text-lg hover:scale-110 transition-transform shadow-sm font-bold">📖</button>
                       <button onClick={() => setNewMessage(p => p + ' 🎉')} className="px-3 py-1.5 bg-white border-2 border-[#E8E2D5] rounded-xl text-lg hover:scale-110 transition-transform shadow-sm font-bold">🎉</button>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyChatPage;
