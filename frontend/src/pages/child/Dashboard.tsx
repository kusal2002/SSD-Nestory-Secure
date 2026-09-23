import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import StoryService from "../../services/storyService";
import AssignmentService from "../../services/assignmentService";
import ReadingService from "../../services/readingService";
import SearchRequestService from "../../services/searchRequestService";
import chatService from "../../services/chatService";
import { Story, Assignment, MyReadingSessionRow } from "../../types";
import toast from "react-hot-toast";
import { MessageCircle, Sparkles, TrendingUp, Trophy, BookOpen, Clock, ChevronRight } from "lucide-react";

import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";
import PlayfulStoryCard from "../../components/child/PlayfulStoryCard";
import GoogleBookSearchCard from "../../components/child/GoogleBookSearchCard";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80";

const normalizeCoverImage = (url) => {
  if (!url || !url.trim()) return FALLBACK_COVER;
  return url.replace(/^http:\/\//i, "https://");
};

const ChildDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [stories, setStories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingReadKey, setStartingReadKey] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState([]);

  const loadDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const [response, progressOverview, sessions] = await Promise.all([
        StoryService.getStories(1, 48),
        AssignmentService.getMyProgressOverview().catch(() => ({ assignments: [] })),
        ReadingService.getMySessions("active").catch(() => []),
      ]);
      const normalizedStories = (response.stories || []).map((s) => ({
        ...s,
        coverImage: normalizeCoverImage(s.coverImage),
      }));
      setStories(normalizedStories);
      setAssignments(progressOverview.assignments || []);
      setActiveSessions(sessions);
    } catch (e) {
      toast.error("Dashboard error");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const beginReadByStoryId = async (storyId, loadingKey) => {
    if (!storyId?.trim()) {
      toast.error("Not available");
      return;
    }
    try {
      setStartingReadKey(loadingKey);
      const { _id } = await ReadingService.startMySession({ storyId });
      navigate(`/child/read/${_id}`);
    } catch (e) {
      toast.error("Could not open");
    } finally {
      setStartingReadKey(null);
    }
  };

  useEffect(() => {
    loadDashboardData(true);
    const i = setInterval(() => loadDashboardData(false), 15000);
    return () => clearInterval(i);
  }, [location.key]);

  const quickPicks = useMemo(() => stories.slice(0, 14), [stories]);
  const localMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return stories.filter(s => s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q));
  }, [searchQuery, stories]);

  const stats = useMemo(() => ({
    completed: assignments.filter(a => a.status === "completed").length,
    total: assignments.length
  }), [assignments]);

  const assignedStories = useMemo(() => {
    return assignments
      .filter(a => a.status !== "completed" && !a.isVirtual)
      .sort((a, b) => {
        // Prioritize by due date if present
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      })
      .slice(0, 6);
  }, [assignments]);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    try {
      setIsSearchingExternal(true);
      const res = await StoryService.searchGoogle(query);
      setExternalResults((res || []).map(b => ({
        id: b.googleBookId,
        title: b.title || "Untitled",
        author: b.author || "Unknown",
        coverImage: normalizeCoverImage(b.coverImage),
        source: "google",
        previewLink: b.previewLink,
        googleBookId: b.googleBookId,
        pageCount: b.pageCount || 0,
      })));
    } catch (e) {
      toast.error("Search failed");
    } finally {
      setIsSearchingExternal(false);
    }
  };

  const handleRequestBook = async (book: any) => {
    try {
      await SearchRequestService.createRequest({
        query: book.title || "",
        suggestedBookName: book.title || "",
        googleBookId: book.googleBookId || "",
        author: book.author || "",
        coverImage: book.coverImage || "",
        previewLink: book.previewLink || "",
        pageCount: book.pageCount || 0,
      });
      toast.success("Request sent! Admins will review this book.");
    } catch (e: any) {
      const message = e?.response?.data?.message || "Failed to send request";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] pl-20 pb-10 transition-colors duration-500">
      <ChildSidebar />
      <div className="max-w-[1600px] mx-auto px-10 pt-4">
        <BookTopBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} isLoading={isSearchingExternal} />

        {!!searchQuery.trim() && (localMatches.length > 0 || externalResults.length > 0) && (
          <div className="space-y-12 mb-16 px-2">
            {localMatches.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase mb-6">Library Matches</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
                  {localMatches.map(s => <PlayfulStoryCard key={s.id||s._id} story={s} onSelect={() => beginReadByStoryId(s.id||s._id, "l-"+s.id)} />)}
                </div>
              </section>
            )}
            {externalResults.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase mb-6">Google results</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
                  {externalResults.map(s => (
                    <GoogleBookSearchCard 
                      key={s.id} 
                      book={s} 
                      onRequest={handleRequestBook}
                      isLoading={isSearchingExternal}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <section className="mb-12">
          <div className="flex items-end gap-3 mb-6 px-2">
            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Latest</h2>
            <button className="text-[10px] font-bold text-gray-400 hover:text-rose-500 underline uppercase tracking-widest decoration-2 underline-offset-4">(view all)</button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-2">
            {stories.slice(0, 10).map(s => (
              <div key={s.id||s._id} className="min-w-[160px] w-[180px] shrink-0">
                <PlayfulStoryCard story={s} onSelect={() => beginReadByStoryId(s.id||s._id, "s-"+s.id)} />
              </div>
            ))}
          </div>
        </section>

        {/* Assigned Stories Section */}
        {assignedStories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end gap-3 mb-6 px-2">
              <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">📚 Your Mission Books</h2>
              <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-widest">{assignedStories.length} to read</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
              {assignedStories.map((assignment, idx) => {
                const progress = assignment.reading?.progressPercent || 0;
                const daysLeft = assignment.deadlinePace?.daysUntilDue;
                const isOverdue = assignment.deadlinePace?.isOverdue;
                const dueDateStr = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
                
                return (
                  <div 
                    key={assignment.assignmentId || idx}
                    className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-[2rem] border-2 border-rose-200 p-6 shadow-md hover:shadow-lg transition-all group overflow-hidden relative"
                  >
                    {/* Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-orange-400"></div>

                    {/* Due Date Badge */}
                    {dueDateStr && (
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        isOverdue 
                          ? 'bg-red-100 text-red-700' 
                          : daysLeft !== null && daysLeft <= 3 
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isOverdue ? '⚠️ Overdue' : daysLeft !== null && daysLeft <= 3 ? '⏰ Due soon' : `Due ${dueDateStr}`}
                      </div>
                    )}

                    {/* Title and Author */}
                    <div className="mb-4 pr-24">
                      <h3 className="text-lg font-black text-gray-800 mb-1 group-hover:text-rose-600 transition-colors uppercase tracking-tight line-clamp-2">
                        {assignment.storyTitle || "Untitled"}
                      </h3>
                    </div>

                    {/* Progress Stats */}
                    <div className="flex flex-col gap-3 mb-4">
                      {/* Pages Read */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-rose-500" />
                          <span className="text-xs font-bold text-gray-600">Pages</span>
                        </div>
                        <span className="text-sm font-black text-gray-800">
                          {assignment.reading?.pagesRead || 0} / {assignment.reading?.totalPages || 0}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-rose-200">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-400 to-orange-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-500">{progress}% complete</span>
                      </div>

                      {/* Time Spent */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-orange-500" />
                          <span className="text-xs font-bold text-gray-600">Reading</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {assignment.reading?.timeSpentMinutes || 0} mins
                        </span>
                      </div>
                    </div>

                    {/* Daily Target */}
                    {assignment.deadlinePace?.pagesPerDayNeeded && (
                      <div className="mb-4 p-3 bg-white/50 rounded-xl border border-orange-200">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Daily Goal</p>
                        <p className="text-lg font-black text-orange-600">{Math.ceil(assignment.deadlinePace.pagesPerDayNeeded)} pages/day</p>
                      </div>
                    )}

                    {/* Continue Reading Button */}
                    {assignment.storyId && (
                      <button
                        onClick={() => beginReadByStoryId(assignment.storyId, `a-${assignment.assignmentId}`)}
                        disabled={startingReadKey === `a-${assignment.assignmentId}`}
                        className="w-full mt-4 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 group/btn"
                      >
                        {startingReadKey === `a-${assignment.assignmentId}` ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            {progress > 0 ? '📖 Continue Reading' : '🚀 Start Reading'}
                            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {assignments.length > assignedStories.length && (
              <div className="mt-4 text-center px-2">
                <button 
                  onClick={() => navigate("/child/progress")}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest underline underline-offset-4"
                >
                  View all {assignments.length} Readings →
                </button>
              </div>
            )}
          </section>
        )}

        <section className="mb-12">
          <div className="flex items-end gap-3 mb-8 px-2">
            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Recommended Books</h2>
            <button className="text-[10px] font-bold text-gray-400 hover:text-rose-500 underline uppercase tracking-widest decoration-2 underline-offset-4">(view all)</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-x-6 gap-y-10 px-2 opacity-95">
            {quickPicks.map(s => <PlayfulStoryCard key={"r-"+(s.id||s._id)} story={s} onSelect={() => beginReadByStoryId(s.id||s._id, "r-"+s.id)} />)}
          </div>
        </section>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 px-2">
           <button 
             onClick={() => navigate("/child/chat")}
             className="bg-white p-8 rounded-[2.5rem] border border-[#E8E2D5] shadow-sm hover:scale-105 transition-all group relative overflow-hidden text-left"
           >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[3rem] -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg border-b-4 border-rose-700">
                    <MessageCircle size={24} />
                 </div>
                 <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Family Chat</h3>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Share stories with your family!</p>
           </button>

           <button 
             onClick={() => navigate("/child/gamification")}
             className="bg-white p-8 rounded-[2.5rem] border border-[#E8E2D5] shadow-sm hover:scale-105 transition-all group relative overflow-hidden text-left"
           >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[3rem] -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg border-b-4 border-blue-700">
                    <Trophy size={24} />
                 </div>
                 <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Awards</h3>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">See your badges & levels!</p>
           </button>

           <button 
             onClick={() => navigate("/child/progress")}
             className="bg-white p-8 rounded-[2.5rem] border border-[#E8E2D5] shadow-sm hover:scale-105 transition-all group relative overflow-hidden text-left"
           >
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[3rem] -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg border-b-4 border-orange-700">
                    <TrendingUp size={24} />
                 </div>
                 <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Reading Stats</h3>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your journey at a glance!</p>
           </button>
        </div>

        <div className="mt-20 pt-10 border-t border-[#E8E2D5] opacity-90">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/40 p-6 rounded-[2rem] border border-white/60">
              <h3 className="font-black text-gray-800 mb-4 uppercase tracking-widest text-xs text-center">Activity</h3>
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-rose-500">{stats.completed}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Done</div>
                </div>
                <div className="w-[1px] h-6 bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-500">{activeSessions.length}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Reading</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 bg-white/40 p-6 rounded-[2rem] border border-white/60 flex flex-col sm:flex-row items-center justify-between px-10 gap-4">
              <div>
                <h3 className="font-black text-gray-800 mb-1 uppercase tracking-widest text-xs text-rose-500">Your Journey</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">You explored {stories.length} stories!</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate("/child/chat")} className="px-5 py-2.5 bg-white text-gray-800 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all border border-[#E8E2D5]">Chat</button>
                <button onClick={() => navigate("/child/progress")} className="px-5 py-2.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-rose-600 transition-all">Stats</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;
