import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, Clock3, PlayCircle, Star } from "lucide-react";
import AssignmentService from "../../services/assignmentService";
import ReadingService from "../../services/readingService";
import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";

const ChildAssignmentDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [bookReading, setBookReading] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!assignmentId) return navigate("/child/dashboard");
      try {
        setIsLoading(true);
        const res = await AssignmentService.getMyAssignmentById(assignmentId);
        setAssignment(res);
      } catch (e) {
        toast.error("Failed to load");
        navigate("/child/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [assignmentId]);

  const storyOid = useMemo(() => assignment ? (assignment.storyId || assignment.story?._id || assignment.story?.id) : null, [assignment]);

  useEffect(() => {
    if (!storyOid) return;
    ReadingService.getProgressByBook(storyOid).then(setBookReading).catch(() => setBookReading(null));
  }, [location.key, storyOid]);

  if (isLoading || !assignment) return (
    <div className="min-h-screen bg-[#F5F1E9] pl-20 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const story = assignment.story || {};
  const isFinished = assignment.status === "completed";

  return (
    <div className="min-h-screen bg-[#F5F1E9] pl-20 pb-12 transition-colors duration-500 font-sans">
      <ChildSidebar />
      <div className="max-w-[1400px] mx-auto px-10 pt-4">
        <BookTopBar searchQuery="" setSearchQuery={() => {}} onSearch={() => {}} />

        <div className="flex items-center gap-4 mb-10">
           <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl border border-[#E8E2D5] hover:bg-rose-50 transition-colors text-gray-600 shadow-sm active:scale-95">
              <ArrowLeft size={20} />
           </button>
           <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Adventure Brief</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
           {/* Left: Book Cover and Status Plate */}
           <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="relative group perspective-1000">
                 <div className="relative aspect-[3/4.2] rounded-[3rem] overflow-hidden bg-white shadow-2xl shadow-gray-200/50 border-[6px] border-white group-hover:rotate-y-12 transition-transform duration-700">
                    <img 
                       src={story.coverImage || "https://images.unsplash.com/photo-1543004471-24598d8392cf?auto=format&fit=crop&w=800&q=80"} 
                       alt={story.title}
                       className="w-full h-full object-cover"
                    />
                    {isFinished && (
                       <div className="absolute top-10 right-10 bg-emerald-500/90 backdrop-blur-md p-4 rounded-3xl text-white transform rotate-12 shadow-xl border border-white/20">
                          <CheckCircle2 size={40} />
                       </div>
                    )}
                 </div>
              </div>

              <div className="bg-white/60 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-lg space-y-6">
                 <div className="flex items-center gap-6 justify-around">
                    <div className="text-center">
                       <div className="text-2xl font-black text-orange-500">{(bookReading?.progressPercent || 0)}%</div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Adventure %</div>
                    </div>
                    <div className="w-[1px] h-10 bg-gray-200"></div>
                    <div className="text-center">
                       <div className="text-2xl font-black text-rose-500">{(bookReading?.pagesRead || 0)}</div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pages Read</div>
                    </div>
                    <div className="w-[1px] h-10 bg-gray-200"></div>
                    <div className="text-center">
                       <div className="text-2xl font-black text-emerald-500">{story.pageCount || "..."}</div>
                       <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Goal</div>
                    </div>
                 </div>
                 
                 <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-[#E8E2D5]">
                    <div 
                       className="h-full bg-gradient-to-r from-orange-400 to-rose-600 rounded-full transition-all duration-1000"
                       style={{ width: `${bookReading?.progressPercent || 0}%` }}
                    />
                 </div>
              </div>
           </div>

           {/* Right: Book Details and Controls */}
           <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
              <div className="bg-white/40 p-10 rounded-[4rem] border border-white shadow-xl shadow-gray-200/30">
                 <div className="flex items-center gap-2 mb-4">
                    <Star className="text-rose-500 fill-rose-500" size={16} />
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] font-sans">Daily Mission</span>
                 </div>
                 <h2 className="text-5xl font-black text-gray-800 leading-tight tracking-tighter uppercase mb-2">{story.title}</h2>
                 <p className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-10">Story by {story.author}</p>
                 
                 <div className="space-y-8 mb-12">
                    <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-[#E8E2D5] shadow-sm">
                       <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shrink-0">
                          <CalendarDays size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</p>
                          <p className="text-lg font-black text-gray-800">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString(undefined, { dateStyle: "long" }) : "No Limit"}</p>
                       </div>
                    </div>

                    <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-[#E8E2D5] shadow-sm">
                       <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                          <BookOpen size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pace Goal</p>
                          <p className="text-lg font-black text-gray-800">10-15 pages per day</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    {!isFinished && storyOid && (
                       <button 
                          onClick={() => navigate(`/child/read/new?storyId=${storyOid}`)}
                          className="w-full py-6 bg-rose-500 text-white text-lg font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4 group"
                       >
                          <PlayCircle size={28} className="group-hover:rotate-12 transition-transform" />
                          Start Adventure
                       </button>
                    )}
                    <button 
                       onClick={() => navigate("/child/dashboard")}
                       className="w-full py-6 bg-white text-gray-800 text-lg font-black uppercase tracking-[0.2em] rounded-[2rem] border-2 border-[#E8E2D5] hover:bg-rose-50 transition-all flex items-center justify-center gap-4"
                    >
                       Library Table
                    </button>
                 </div>
              </div>

              {story.description && (
                 <section className="bg-white/60 p-10 rounded-[4rem] border border-white shadow-lg">
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-6">Briefing Story</h3>
                    <p className="text-gray-600 font-bold leading-relaxed text-sm uppercase tracking-tight opacity-70">
                       {story.description}
                    </p>
                 </section>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChildAssignmentDetailPage;
