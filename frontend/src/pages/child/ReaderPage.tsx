import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, BookOpen, Trophy, Star, Sparkles, Book as BookIcon } from "lucide-react";
import toast from "react-hot-toast";
import StoryService from "../../services/storyService";
import AssignmentService from "../../services/assignmentService";
import { useAuth } from "../../contexts/AuthContext";
import { Story } from "../../types";
import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 border-8 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-6" />
      <p className="text-2xl font-black text-rose-500 uppercase tracking-widest">Finding Your Story...</p>
    </div>
  </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center p-8">
    <div className="bg-white border-4 border-black rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 max-w-xl w-full text-center">
      <div className="bg-rose-100 border-4 border-black rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8">
        <span className="text-rose-600 text-5xl">!</span>
      </div>
      <h2 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">Oops! Adventure Halted</h2>
      <p className="text-xl font-bold text-gray-600 mb-10 uppercase tracking-wide">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="w-full bg-rose-500 border-4 border-black py-4 rounded-2xl font-black text-white uppercase tracking-widest text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none transition-all"
      >
        Go Back
      </button>
    </div>
  </div>
);

const ReaderPage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        setError("Story ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const storyData = await StoryService.getStoryById(storyId);

        if (user?.role === "child") {
          const assignments = await AssignmentService.getMyAssignments().catch(() => []);
          const sid = String(storyId);
          const allowed = assignments.some(
            (a) =>
              a.status !== "completed" &&
              sid === String(a.storyId || a.story?._id || a.story?.id || ""),
          );
          if (!allowed) {
            setStory(null);
            setError("This book is not assigned to you. Ask a parent to assign it before reading.");
            return;
          }
        }
        setStory(storyData);
        setError(null);
      } catch (err: unknown) {
        setError("Failed to load the story. Please try again.");
        toast.error("Story loading failed");
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, user?.role]);

  if (isLoading) return <LoadingSpinner />;
  if (error || !story) return <ErrorDisplay message={error || "Story not found"} />;

  const googleId = story.googleBookId?.trim();
  const previewUrl = story.previewLink?.trim();
  const pdfUrl = (story as any).pdfUrl;

  const fullPdfUrl = pdfUrl ? `http://localhost:5000${pdfUrl}` : null;

  return (
    <div className="min-h-screen bg-[#F5F1E9]">
      <ChildSidebar />
      <div className="pl-20 transition-all duration-300">
        <BookTopBar searchQuery="" setSearchQuery={() => {}} onSearch={() => {}} />

        <main className="p-8 max-w-6xl mx-auto">
          {/* Main Book Card */}
          <div className="bg-white border-4 border-black rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left: Cover & Visuals */}
              <div className="bg-rose-400 p-12 flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black relative overflow-hidden">
                <div className="absolute top-4 left-4 flex gap-2">
                   <div className="bg-white border-2 border-black rounded-full p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Star size={16} className="text-orange-400 fill-orange-400" /></div>
                   <div className="bg-white border-2 border-black rounded-full p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Sparkles size={16} className="text-rose-400" /></div>
                </div>
                
                <div className="relative group perspective-1000 w-full max-w-[280px]">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-auto border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-[-2deg]"
                  />
                </div>
                
                <div className="mt-12 flex flex-wrap justify-center gap-4 w-full">
                  <div className="bg-white border-4 border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                    <Trophy size={20} className="text-orange-500" />
                    <span className="font-black text-sm uppercase">{story.readingLevel}</span>
                  </div>
                  <div className="bg-white border-4 border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="font-black text-sm uppercase">{story.ageGroup}</span>
                  </div>
                </div>
              </div>

              {/* Right: Info & Actions */}
              <div className="p-12 flex flex-col">
                <div className="mb-8">
                  <h1 className="text-5xl font-black text-black uppercase tracking-tight leading-none mb-4">
                    {story.title}
                  </h1>
                  <h2 className="text-2xl font-bold text-rose-500 uppercase tracking-widest pl-1">
                    By {story.author}
                  </h2>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="bg-[#F5F1E9] border-4 border-black rounded-[2rem] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black uppercase tracking-widest text-orange-500 mb-2 flex items-center gap-2">
                      <BookIcon size={18} />
                      Story Brief
                    </h3>
                    <p className="text-lg font-bold text-gray-700 leading-relaxed italic">
                      "{story.description || "The exact plot is a mystery waiting for you to uncover!"}"
                    </p>
                  </div>

                  {story.genres && story.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {story.genres.map((g) => (
                        <span key={g} className="bg-orange-100 border-2 border-black px-3 py-1 rounded-full font-black text-xs uppercase text-orange-600">
                          #{g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-12 space-y-4">
                  {fullPdfUrl ? (
                    <a
                      href={fullPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-400 border-4 border-black py-5 rounded-[2rem] flex items-center justify-center gap-4 font-black text-white uppercase tracking-widest text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] active:translate-y-2 active:shadow-none transition-all"
                    >
                      <BookOpen size={32} />
                      Read Story (PDF)
                      <ExternalLink size={24} />
                    </a>
                  ) : googleId ? (
                    <a
                      href={`https://books.google.com/books?id=${googleId}&printsec=frontcover`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-400 border-4 border-black py-5 rounded-[2rem] flex items-center justify-center gap-4 font-black text-white uppercase tracking-widest text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] active:translate-y-2 active:shadow-none transition-all"
                    >
                      <BookOpen size={32} />
                      Start Reading
                      <ExternalLink size={24} />
                    </a>
                  ) : previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-400 border-4 border-black py-5 rounded-[2rem] flex items-center justify-center gap-4 font-black text-white uppercase tracking-widest text-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] active:translate-y-2 active:shadow-none transition-all"
                    >
                      <BookOpen size={32} />
                      View Preview
                      <ExternalLink size={24} />
                    </a>
                  ) : (
                    <div className="bg-orange-100 border-4 border-black p-6 rounded-[2rem] text-center">
                       <p className="font-black text-orange-600 uppercase tracking-widest">Digital scroll not found!</p>
                       <p className="font-bold text-orange-400 text-sm mt-1 uppercase italic">Use your physical tome and log pages in the dashboard!</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => navigate(-1)}
                    className="w-full bg-white border-4 border-black py-4 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                  >
                    <ArrowLeft size={18} />
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Bottom Bar */}
          <div className="flex justify-between items-center px-8 opacity-50">
             <div className="flex gap-4">
                <Star className="text-orange-400" />
                <Star className="text-rose-400" />
                <Star className="text-emerald-400" />
             </div>
             <p className="font-black uppercase tracking-widest text-gray-400 text-xs">Adventure Awaits � Nestory v1.0</p>
             <div className="flex gap-4 rotate-180">
                <Star className="text-orange-400" />
                <Star className="text-rose-400" />
                <Star className="text-emerald-400" />
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReaderPage;
