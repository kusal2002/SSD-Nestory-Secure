import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AssignmentService from "../../services/assignmentService";
import ReadingService from "../../services/readingService";
import { AssignmentProgressOverview, ReadingActivitySummary } from "../../types";
import toast from "react-hot-toast";
import { BarChart3, TrendingUp, BookOpen, Clock, CheckCircle2, ArrowLeft } from "lucide-react";
import ReadingWeeklyBarChart from "../../components/progress/ReadingWeeklyBarChart";
import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";

const ChildProgressPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AssignmentProgressOverview | null>(null);
  const [weekActivity, setWeekActivity] = useState<ReadingActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [overview, activity] = await Promise.all([
          AssignmentService.getMyProgressOverview().catch(() => null),
          ReadingService.getMyActivitySummary(7).catch(() => null),
        ]);
        if (!cancelled) {
          setData(overview);
          setWeekActivity(activity);
        }
      } catch (e) {
        toast.error("Failed to load progress");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F5F1E9] pl-20 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F1E9] pl-20 pb-12 transition-colors duration-500">
      <ChildSidebar />
      <div className="max-w-[1400px] mx-auto px-10 pt-4">
        <BookTopBar searchQuery="" setSearchQuery={() => {}} onSearch={() => {}} />

        <div className="flex items-center gap-4 mb-10">
           <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl border border-[#E8E2D5] hover:bg-rose-50 transition-colors text-gray-600 shadow-sm active:scale-95">
              <ArrowLeft size={20} />
           </button>
           <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">My Journey Log</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column: Weekly Stats & Chart */}
           <div className="lg:col-span-2 space-y-8">
              {weekActivity && (
                 <section className="bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <TrendingUp className="text-rose-500" size={24} />
                          <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">This Week</h2>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
                       <div className="bg-white p-6 rounded-[2rem] border border-[#E8E2D5] shadow-sm text-center transform hover:scale-105 transition-transform">
                          <BookOpen className="mx-auto mb-2 text-rose-400" size={20} />
                          <p className="text-2xl font-black text-gray-800">{weekActivity.totalPagesLogged || 0}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pages</p>
                       </div>
                       <div className="bg-white p-6 rounded-[2rem] border border-[#E8E2D5] shadow-sm text-center transform hover:scale-105 transition-transform">
                          <Clock className="mx-auto mb-2 text-orange-400" size={20} />
                          <p className="text-2xl font-black text-gray-800">{weekActivity.totalMinutesLogged || 0}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Minutes</p>
                       </div>
                       <div className="bg-white p-6 rounded-[2rem] border border-[#E8E2D5] shadow-sm text-center transform hover:scale-105 transition-transform">
                          <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={20} />
                          <p className="text-2xl font-black text-gray-800">{weekActivity.progressSaveCount || 0}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Saves</p>
                       </div>
                       <div className="bg-white p-6 rounded-[2rem] border border-[#E8E2D5] shadow-sm text-center transform hover:scale-105 transition-transform">
                          <TrendingUp className="mx-auto mb-2 text-blue-400" size={20} />
                          <p className="text-2xl font-black text-gray-800">{Math.round((weekActivity.totalMinutesLogged || 0) / (weekActivity.days || 1))}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Avg Min</p>
                       </div>
                    </div>

                    <div className="flex flex-col rounded-[2.5rem] p-8 border border-white shadow-inner bg-white/70" style={{ height: "400px" }}>
                       <div className="flex items-center justify-between mb-4 flex-shrink-0">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Reading Pulse</span>
                          <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                             <div className="w-2 h-2 rounded-full bg-rose-200"></div>
                          </div>
                       </div>
                       <div className="flex-1 min-h-0 w-full">
                         <ReadingWeeklyBarChart byDay={weekActivity.byDay || []} title="Reading Status" />
                       </div>
                    </div>
                 </section>
              )}

              {/* Assignments Progress */}
              <section className="space-y-6">
                 <div className="flex items-center gap-3 mb-6 px-4">
                    <BarChart3 className="text-rose-500" size={24} />
                    <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">My Books Status</h2>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-6">
                    {data?.assignments && data.assignments.length > 0 ? (
                      data.assignments.map((row) => (
                        <div key={row.assignmentId} className="bg-white/70 hover:bg-white transition-all rounded-[2rem] p-6 border border-[#E8E2D5] shadow-sm hover:shadow-lg group">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="flex-1">
                                  <h3 className="text-lg font-black text-gray-800 mb-1 group-hover:text-rose-500 transition-colors uppercase tracking-tight">{row.storyTitle}</h3>
                                  <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Clock size={12} /> {row.reading.timeSpentMinutes} MIN READ</span>
                                    <span className="flex items-center gap-1.5"><BookOpen size={12} /> {row.reading.pagesRead} / {row.reading.totalPages} PAGES</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                  <div className="text-right">
                                    <div className="text-xl font-black text-rose-500">{row.reading.progressPercent}%</div>
                                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">Completed</div>
                                  </div>
                                  <div className="w-16 h-16 rounded-2xl bg-[#F5F1E9] flex items-center justify-center border border-[#E8E2D5] group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">🔥</span>
                                  </div>
                              </div>
                            </div>
                            
                            <div className="mt-6 w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-[#E8E2D5]">
                              <div 
                                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000"
                                  style={{ width: `${row.reading.progressPercent}%` }}
                              />
                            </div>

                            {row.status !== "completed" && (
                              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target for today: <span className="text-gray-800">{row.deadlinePace?.pagesDesiredDaily || "..."} pages</span></span>
                                  {row.storyId && <button onClick={() => navigate(`/child/read/new?storyId=${row.storyId}`)} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest underline underline-offset-4">Continue Reading</button>}
                               </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/50 rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-200">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="font-black text-gray-400 uppercase tracking-widest">No books in progress yet!</p>
                        <button onClick={() => navigate("/child/dashboard")} className="mt-4 text-rose-500 font-bold uppercase text-xs underline underline-offset-4 tracking-widest">Go pick a story</button>
                      </div>
                    )}
                 </div>
              </section>
           </div>

           {/* Right Column: Tips & Sidebar info */}
           <div className="space-y-8 lg:sticky lg:top-4 h-fit">
              <section className="bg-orange-400 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-200/40 relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                 <h2 className="text-2xl font-black uppercase tracking-tight mb-4 relative z-10">Hero Tip!</h2>
                 <p className="text-orange-50 font-bold text-sm leading-relaxed mb-6 relative z-10">Reading every day builds your "Stamina Stat"! ⚡ Try to read at least 10 minutes before bed to keep your streak alive.</p>
                 <div className="p-4 bg-orange-500/50 rounded-2xl border border-orange-300/30 flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-orange-200/50">
                       <TrendingUp className="text-orange-500" size={20} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-orange-200">Next Level</div>
                       <div className="font-black text-lg">Goal Seeker</div>
                    </div>
                 </div>
              </section>

              <section className="bg-white border border-[#E8E2D5] rounded-[2.5rem] p-8 shadow-sm">
                 <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">Achievements</h2>
                 <div className="space-y-4">
                    {[
                       { title: "First Page", desc: "Log your first page read", icon: "?", done: true },
                       { title: "Speedster", desc: "Read for 30 mins in one go", icon: "?", done: false },
                       { title: "Book Worm", desc: "Finish your first book", icon: "🐛", done: false }
                    ].map((ach, idx) => (
                       <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border ${ach.done ? "bg-rose-50 border-rose-100" : "bg-gray-50 border-gray-100 opacity-60"}`}>
                          <span className="text-2xl">{ach.icon}</span>
                          <div>
                             <div className="text-xs font-black text-gray-800 uppercase tracking-tight">{ach.title}</div>
                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{ach.desc}</div>
                          </div>
                          {ach.done && <CheckCircle2 size={16} className="ml-auto text-rose-500" />}
                       </div>
                    ))}
                 </div>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChildProgressPage;
