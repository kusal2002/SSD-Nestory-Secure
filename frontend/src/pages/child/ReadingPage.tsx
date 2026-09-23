import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Maximize2,
  Minus,
  Minimize2,
  Plus,
  X,
  Sparkles,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";
import ReadingService, { SessionListItem } from "../../services/readingService";
import StoryService from "../../services/storyService";
import AssignmentService from "../../services/assignmentService";
import GamificationService from "../../services/gamificationService";
import { Story, Quiz } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import {
  computePagesToAddFromViewer,
  createEmptySegment,
  resetSegmentFromViewer,
  type ViewerSegmentState,
} from "../../utils/googleBooksViewerProgress";
import {
  ensureGoogleBooksViewerApi,
  googleBooksEmbedIframeSrc,
  googleBooksLoadIdentifiers,
  googleBooksPreviewUrlIdentifier,
} from "../../utils/loadGoogleBooksViewer";
import {
  extractGoogleBooksEmbedPageHint,
  isLikelyGoogleBooksOrigin,
} from "../../utils/googleBooksIframeMessages";

declare global {
  interface Window {
    google: any;
  }
}

const VIEWER_POLL_MS = 120;
const GOOGLE_BOOKS_IFRAME_ONLY = import.meta.env.VITE_GOOGLE_BOOKS_IFRAME_ONLY === "true";
const GOOGLE_BOOKS_DISABLE_EMBED = import.meta.env.VITE_GOOGLE_BOOKS_DISABLE_EMBED === "true";

const rawAutoIframeMs = import.meta.env.VITE_GOOGLE_BOOKS_AUTO_IFRAME_FALLBACK_MS;
let AUTO_IFRAME_FALLBACK_MS = 8000;
if (rawAutoIframeMs !== undefined && rawAutoIframeMs !== null && String(rawAutoIframeMs).trim() !== "") {
  const p = Number.parseInt(String(rawAutoIframeMs), 10);
  if (Number.isFinite(p)) AUTO_IFRAME_FALLBACK_MS = p <= 0 ? 0 : p;
}

const IFRAME_FALLBACK_OFFER_MS = 5000;

type GoogleBookEmbedMode = "js" | "iframe" | "none";

function initialGoogleBookEmbedMode(): GoogleBookEmbedMode {
  if (GOOGLE_BOOKS_DISABLE_EMBED) return "none";
  if (GOOGLE_BOOKS_IFRAME_ONLY) return "iframe";
  return "js";
}

const ReadingPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [session, setSession] = useState<SessionListItem | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pagesToAdd, setPagesToAdd] = useState(0);

  // Quiz State
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{ correct: number; total: number; points: number } | null>(null);
  const [manualPageOverride, setManualPageOverride] = useState(false);

  const [viewerReady, setViewerReady] = useState(false);
  const [embedMode, setEmbedMode] = useState<GoogleBookEmbedMode>(() => initialGoogleBookEmbedMode());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeFallbackOfferVisible, setIframeFallbackOfferVisible] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [viewerPageLabel, setViewerPageLabel] = useState("");

  const viewerSegmentRef = useRef<ViewerSegmentState>(createEmptySegment());
  const maxPagesRef = useRef(0);
  const timerAutoStartedRef = useRef(false);
  const viewerReadyRef = useRef(false);
  const embedModeRef = useRef<GoogleBookEmbedMode>(embedMode);
  const abandonJsViewerRef = useRef(false);
  const viewerInitGenRef = useRef(0);
  const iframePageHintRef = useRef<number | null>(null);
  const chevronNetRef = useRef(0);

  const switchToIframeEmbed = useCallback(() => {
    abandonJsViewerRef.current = true;
    chevronNetRef.current = 0;
    setIframeFallbackOfferVisible(false);
    setEmbedMode("iframe");
  }, []);

  const retryInteractiveViewer = useCallback(() => {
    viewerInitGenRef.current += 1;
    abandonJsViewerRef.current = false;
    chevronNetRef.current = 0;
    viewerRef.current = null;
    viewerSegmentRef.current = createEmptySegment();
    setViewerReady(false);
    setViewerPageLabel("");
    setPagesToAdd(0);
    setManualPageOverride(false);
    setIframeFallbackOfferVisible(false);
    setEmbedMode("js");
  }, []);

  const bumpPagesToAdd = useCallback((delta: number) => {
    setPagesToAdd((n) => {
      const cap = maxPagesRef.current;
      return Math.min(cap, Math.max(0, n + delta));
    });
  }, []);

  useEffect(() => {
    viewerReadyRef.current = viewerReady;
  }, [viewerReady]);

  useEffect(() => {
    embedModeRef.current = embedMode;
  }, [embedMode]);

  const [assignmentCompleteHint, setAssignmentCompleteHint] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [markingAssignment, setMarkingAssignment] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const manualPageOverrideRef = useRef(false);
  useEffect(() => {
    manualPageOverrideRef.current = manualPageOverride;
  }, [manualPageOverride]);

  const applyViewerScan = useCallback(() => {
    if (manualPageOverrideRef.current) return;
    const v = viewerRef.current;
    if (!v) return;
    const cap = maxPagesRef.current;
    const { pagesToAdd: computed, pageLabel } = computePagesToAddFromViewer(
      v,
      viewerSegmentRef.current,
      cap
    );
    const merged = Math.min(cap, Math.max(computed, chevronNetRef.current));
    setPagesToAdd(merged);
    if (pageLabel) setViewerPageLabel(pageLabel);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!sessionId) {
        toast.error("Invalid session");
        navigate("/child");
        return;
      }

      try {
        setIsLoading(true);

        // Handle special case where sessionId is "new" - need to create/resume session
        if (sessionId === "new") {
          const storyId = searchParams.get("storyId");
          // Check for null, empty, or the string 'null'/'undefined'
          if (!storyId || storyId === 'null' || storyId === 'undefined') {
            toast.error("Story ID is required to start a session");
            navigate("/child");
            return;
          }

          // Create or resume a session for this story
          try {
            const result = await ReadingService.startMySession({ storyId });
            // Navigate to the actual session page
            navigate(`/child/read/${result._id}`, { replace: true });
            return;
          } catch (error: any) {
            toast.error(
              error?.response?.data?.message || "Failed to start reading session"
            );
            navigate("/child");
            return;
          }
        }

        const sessions = await ReadingService.getMySessions();
        const found = sessions.find((s) => s._id === sessionId);
        if (!found) {
          toast.error("Session not found");
          navigate("/child");
          return;
        }
        setSession(found);

        const bookRef = found.bookId;
        const bookStoryId =
          typeof bookRef === "object" && bookRef !== null
            ? String((bookRef as { _id?: string })._id || "")
            : bookRef
              ? String(bookRef)
              : "";
        if (bookStoryId) {
          const storyData = await StoryService.getStoryById(bookStoryId).catch(() => null);
          setStory(storyData);
        } else {
          setStory(null);
        }
      } catch (error: any) {
        toast.error("Failed to load reading session");
        navigate("/child");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [sessionId, searchParams, navigate]);

  // Auto-start the Adventure Timer when user opens a reading session
  useEffect(() => {
    if (session && story && !timerAutoStartedRef.current && !isLoading) {
      timerAutoStartedRef.current = true;
      setIsTimerRunning(true);
      toast.success("🎯 Adventure Timer Started! Let's read!", {
        icon: "⏱️",
        duration: 2000,
      });
    }
  }, [session, story, isLoading]);

  useEffect(() => {
    viewerInitGenRef.current += 1;
    timerAutoStartedRef.current = false;
    abandonJsViewerRef.current = false;
    iframePageHintRef.current = null;
    chevronNetRef.current = 0;
    viewerSegmentRef.current = createEmptySegment();
    setManualPageOverride(false);
    setPagesToAdd(0);
    setIframeFallbackOfferVisible(false);
    setEmbedMode(initialGoogleBookEmbedMode());
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;
    maxPagesRef.current = Math.max(0, session.totalPages - session.pagesRead);
  }, [session]);

  const initViewer = useCallback((): Promise<void> => {
    const volumeId = story?.googleBookId?.trim();
    if (!volumeId) return Promise.resolve();

    const doLoad = () => {
      if (abandonJsViewerRef.current || embedModeRef.current !== "js") return;
      const gen = ++viewerInitGenRef.current;

      const onReady = (viewer: any) => {
        if (abandonJsViewerRef.current || embedModeRef.current !== "js" || gen !== viewerInitGenRef.current) return;
        viewerRef.current = viewer;
        viewerSegmentRef.current = createEmptySegment();
        setViewerPageLabel("");
        setPagesToAdd(0);
        setManualPageOverride(false);
        setViewerReady(true);
        chevronNetRef.current = 0;
        setTimeout(() => viewer.resize?.(), 100);
        setTimeout(() => viewer.resize?.(), 400);
        setTimeout(() => viewer.resize?.(), 900);
        setTimeout(() => {
          if (gen !== viewerInitGenRef.current) return;
          viewer.resize?.();
          const cap = maxPagesRef.current;
          const { pagesToAdd: next, pageLabel } = computePagesToAddFromViewer(
            viewer,
            viewerSegmentRef.current,
            cap
          );
          setPagesToAdd(next);
          if (pageLabel) setViewerPageLabel(pageLabel);
        }, 350);
      };

      const runStage = (stage: "primary" | "urlOnly") => {
        if (abandonJsViewerRef.current || embedModeRef.current !== "js" || gen !== viewerInitGenRef.current) return;
        const container = viewerContainerRef.current;
        if (!container) {
          switchToIframeEmbed();
          return;
        }
        if (!window.google?.books?.DefaultViewer) {
          switchToIframeEmbed();
          return;
        }

        const viewer = new window.google.books.DefaultViewer(container);
        const ids =
          stage === "primary" ? googleBooksLoadIdentifiers(volumeId) : googleBooksPreviewUrlIdentifier(volumeId);

        viewer.load(
          ids,
          () => {
            if (abandonJsViewerRef.current || embedModeRef.current !== "js" || gen !== viewerInitGenRef.current) return;
            if (stage === "primary") {
              container.replaceChildren();
              runStage("urlOnly");
              return;
            }
            switchToIframeEmbed();
          },
          () => onReady(viewer)
        );
      };

      runStage("primary");
    };

    const waitForContainer = (attempt: number): Promise<void> => {
      if (abandonJsViewerRef.current || embedModeRef.current !== "js") {
        return Promise.resolve();
      }
      if (viewerContainerRef.current) {
        return ensureGoogleBooksViewerApi()
          .then(doLoad)
          .catch(() => switchToIframeEmbed());
      }
      if (attempt >= 20) return Promise.resolve();
      const delay = attempt === 0 ? 0 : 40;
      return new Promise((resolve) => {
        window.setTimeout(() => {
          void waitForContainer(attempt + 1).then(resolve);
        }, delay);
      });
    };

    return waitForContainer(0);
  }, [story?.googleBookId, switchToIframeEmbed]);

  useEffect(() => {
    viewerInitGenRef.current += 1;
    setViewerReady(false);
    abandonJsViewerRef.current = false;
    iframePageHintRef.current = null;
    chevronNetRef.current = 0;
    setIframeFallbackOfferVisible(false);
    setEmbedMode(initialGoogleBookEmbedMode());
    viewerRef.current = null;
    viewerSegmentRef.current = createEmptySegment();
    setViewerPageLabel("");
    setPagesToAdd(0);
    setManualPageOverride(false);
  }, [story?.id]);

  useEffect(() => {
    if (GOOGLE_BOOKS_IFRAME_ONLY || embedMode !== "js" || !story?.googleBookId?.trim()) return undefined;
    if (viewerReady) return undefined;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void initViewer();
    };
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [story?.googleBookId, story?.id, initViewer, embedMode, viewerReady]);

  useEffect(() => {
    if (AUTO_IFRAME_FALLBACK_MS > 0) {
      const t = window.setTimeout(() => {
        if (embedModeRef.current === "js" && !viewerReadyRef.current) {
          switchToIframeEmbed();
        }
      }, AUTO_IFRAME_FALLBACK_MS);
      return () => window.clearTimeout(t);
    }
  }, [switchToIframeEmbed]);

  useEffect(() => {
    if (embedMode !== "iframe" || !story?.googleBookId?.trim()) return;

    const onMessage = (ev: MessageEvent) => {
      if (!isLikelyGoogleBooksOrigin(ev.origin)) return;
      const page = extractGoogleBooksEmbedPageHint(ev.data);
      if (page == null) return;

      const prev = iframePageHintRef.current;
      if (prev === null) {
        iframePageHintRef.current = page;
        return;
      }
      if (page > prev) {
        const delta = page - prev;
        iframePageHintRef.current = page;
        setPagesToAdd((n) => Math.min(maxPagesRef.current, n + delta));
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embedMode, story?.googleBookId]);

  useEffect(() => {
    if (embedMode !== "js" || !viewerReady || manualPageOverride) return;
    const id = window.setInterval(applyViewerScan, VIEWER_POLL_MS);
    applyViewerScan();
    return () => window.clearInterval(id);
  }, [embedMode, viewerReady, manualPageOverride, applyViewerScan]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleUpdateProgress = async () => {
    if (!session || !sessionId) return;
    const savedPages = pagesToAdd;
    try {
      setIsUpdating(true);
      const minutesSpent = Math.max(1, Math.round(elapsed / 60));
      await ReadingService.updateSession({
        sessionId,
        pagesRead: savedPages,
        timeSpent: minutesSpent,
      });

      const sessions = await ReadingService.getMySessions();
      const updated = sessions.find((s) => s._id === sessionId);
      if (updated) setSession(updated);

      setElapsed(0);
      setIsTimerRunning(false);
      const v = viewerRef.current;
      viewerSegmentRef.current = v ? resetSegmentFromViewer(v) : createEmptySegment();
      setPagesToAdd(0);
      setManualPageOverride(false);
      iframePageHintRef.current = null;
      chevronNetRef.current = 0;
      toast.success(
        updated?.completed
          ? "Adventure Complete! Great reading! 🎉"
          : `Great work! ${savedPages} pages logged. Keep going!`
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update progress");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleGenerateQuiz = async () => {
    if (!story || !user) return;
    try {
      setIsGeneratingQuiz(true);
      const data = await GamificationService.generateQuiz(story.id, user.id, user.role === 'child' ? user.childProfile : undefined);
      setQuiz(data);
      setQuizAnswers(new Array(data.questions.length).fill(""));
      setQuizResult(null);
      toast.success("Magic Quiz Generated! ✨");
    } catch (error) {
      toast.error("Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !user) return;
    if (quizAnswers.some(a => !a)) {
      toast.error("Answer all questions first!");
      return;
    }

    try {
      setIsSubmittingQuiz(true);
      const result = await GamificationService.completeQuiz(quiz._id, quizAnswers, user.id, user.role === 'child' ? user.childProfile : undefined);
      setQuizResult({
        correct: result.correctCount,
        total: result.totalQuestions,
        points: result.xpAwarded
      });
      setQuiz(null);
      toast.success(`Quiz Complete! You earned ${result.xpAwarded} XP! 🎊`);
    } catch (error) {
      toast.error("Failed to submit quiz");
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-8 border-rose-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-2xl font-black text-rose-500 uppercase tracking-widest">Opening Book...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const pagesRemaining = session.totalPages - session.pagesRead;
  const maxPages = Math.max(pagesRemaining, 0);
  const googleId = story?.googleBookId?.trim();
  const previewUrl = story?.previewLink?.trim();
  const pdfUrl = story?.pdfUrl?.trim();
  const fallbackGoogleBooksUrl =
    googleId && !previewUrl
      ? `https://books.google.com/books?id=${encodeURIComponent(googleId)}&printsec=frontcover`
      : "";
  const effectivePreviewUrl = previewUrl || fallbackGoogleBooksUrl;
  const hasGoogleBook = !!googleId;
  const hasPdf = !!pdfUrl;
  const useAutoPageTracking = hasGoogleBook && embedMode === "js" && viewerReady && !manualPageOverride;
  const canSaveProgress = pagesToAdd >= 1;

  return (
    <div className="min-h-screen bg-[#F5F1E9]">
      {!isFullscreen && <ChildSidebar />}
      
      <div className={`${isFullscreen ? "h-screen" : "pl-20"} transition-all duration-300`}>
        {!isFullscreen && <BookTopBar onSearch={() => {}} />}

        <main className={`${isFullscreen ? "h-full flex flex-col" : "p-8 max-w-6xl mx-auto"}`}>
          {/* Header Card */}
          {!isFullscreen && (
            <div className="bg-white border-4 border-black rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-orange-500 border-4 border-black rounded-full px-4 py-1 font-black text-white text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {session.progress}% COMPLETED
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-32 h-44 bg-rose-500 border-4 border-black rounded-[1.5rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 rotate-[-3deg]">
                   <BookOpen size={48} className="text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-black text-black uppercase tracking-tight mb-2">
                    {session.bookId?.title || "Untitled Adventure"}
                  </h1>
                  <p className="text-xl font-bold text-gray-600 mb-6 uppercase tracking-wider">
                    Author: {session.bookId?.author || "Unknown Hero"}
                  </p>
                  
                  <div className="w-full bg-gray-200 border-4 border-black rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${session.completed ? "bg-emerald-400" : "bg-rose-500"}`}
                      style={{ width: `${Math.min(session.progress, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-black text-sm uppercase tracking-widest mix-blend-difference text-white">
                      {session.pagesRead} / {session.totalPages} PAGES
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Book Reader (2 cols) */}
            <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-black flex flex-col" : "lg:col-span-2"}`}>
              <div className={`bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col ${isFullscreen ? "h-full rounded-none border-0 shadow-none" : "h-[700px]"}`}>
                <div className="bg-orange-400 border-b-4 border-black p-4 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                    {isFullscreen && (
                      <button onClick={toggleFullscreen} className="bg-white border-4 border-black p-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
                        <ArrowLeft size={24} />
                      </button>
                    )}
                    <span className="font-black text-white uppercase tracking-widest text-lg">
                       {viewerPageLabel || "Reading Now"}
                    </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <button
                        onClick={toggleFullscreen}
                        className="bg-white border-4 border-black p-1 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                      >
                        {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                      </button>
                   </div>
                </div>

                <div className="flex-1 bg-gray-100 relative overflow-hidden">
                   {hasGoogleBook ? (
                     embedMode === "iframe" ? (
                      <iframe
                        title="Book preview"
                        src={googleBooksEmbedIframeSrc(googleId || "")}
                        className="w-full h-full border-0 bg-white"
                        loading="eager"
                        referrerPolicy="origin-when-cross-origin"
                        allowFullScreen
                      />
                     ) : (
                       <>
                        <div ref={viewerContainerRef} className="w-full h-full bg-white" />
                        {!viewerReady && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                             <div className="text-center p-8 bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="font-black uppercase tracking-widest text-black">Opening Magic Mirror...</p>
                                {iframeFallbackOfferVisible && (
                                  <button onClick={switchToIframeEmbed} className="mt-4 px-4 py-2 bg-orange-500 border-4 border-black rounded-xl text-white font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    Switch to Simple View
                                  </button>
                                )}
                             </div>
                          </div>
                        )}
                       </>
                     )
                   ) : hasPdf ? (
                     <div className="w-full h-full bg-white">
                       <iframe
                         title="PDF preview"
                         src={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                         className="w-full h-full border-0"
                         loading="lazy"
                       />
                     </div>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center p-12 text-center">
                        <div>
                          <BookOpen size={80} className="text-gray-300 mx-auto mb-6" />
                          <h3 className="text-2xl font-black text-gray-400 uppercase tracking-widest mb-4">No Preview Available</h3>
                          <p className="text-gray-500 font-bold max-w-sm mx-auto uppercase">Ask a parent to check if this book has a Google Preview or upload a PDF!</p>
                        </div>
                     </div>
                   )}
                </div>

                {/* Reader Controls */}
                <div className="bg-[#F5F1E9] border-t-4 border-black p-4 flex items-center justify-between">
                   <div className="flex gap-4">
                     <button onClick={() => { viewerRef.current?.previousPage(); chevronNetRef.current--; applyViewerScan(); }} className="bg-white border-4 border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
                        <ChevronLeft size={32} />
                     </button>
                     <button onClick={() => { viewerRef.current?.nextPage(); chevronNetRef.current++; applyViewerScan(); }} className="bg-white border-4 border-black p-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
                        <ChevronRight size={32} />
                     </button>
                   </div>
                   
                   {isFullscreen && (
                      <div className="flex-1 flex justify-center gap-8 px-8 items-center">
                        <div className="flex items-center gap-2">
                          <Clock className="text-rose-500" size={24} />
                          <span className="font-black text-2xl font-mono">{formatTime(elapsed)}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button onClick={() => bumpPagesToAdd(-1)} className="bg-white border-4 border-black w-10 h-10 rounded-xl font-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">-</button>
                          <div className="bg-white border-4 border-black px-6 py-2 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-xl">
                            {pagesToAdd} <span className="text-xs text-gray-400">PAGES</span>
                          </div>
                          <button onClick={() => bumpPagesToAdd(1)} className="bg-white border-4 border-black w-10 h-10 rounded-xl font-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">+</button>
                        </div>
                        <button 
                          onClick={handleUpdateProgress}
                          disabled={isUpdating || !canSaveProgress}
                          className="bg-emerald-400 border-4 border-black px-8 py-3 rounded-2xl font-black text-white uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                        >
                          {isUpdating ? "LOGGING..." : "SAVE PROGRESS"}
                        </button>
                      </div>
                   )}
                </div>
              </div>
            </div>

            {/* Right: Stats & Logging (1 col) */}
            {!isFullscreen && (
              <div className="space-y-8">
                {/* Timer Box */}
                <div className="bg-white border-4 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                   <h3 className="font-black uppercase tracking-widest text-gray-400 text-sm mb-4">Adventure Timer</h3>
                   <div className="flex items-center justify-between mb-4">
                     <span className="text-4xl font-black font-mono text-black">{formatTime(elapsed)}</span>
                     <button 
                       onClick={() => setIsTimerRunning(!isTimerRunning)}
                       className={`w-16 h-16 rounded-full border-4 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 flex items-center justify-center ${isTimerRunning ? "bg-rose-400" : "bg-emerald-400"}`}
                     >
                       {isTimerRunning ? <X size={32} className="text-white" /> : <Clock size={32} className="text-white" />}
                     </button>
                   </div>
                </div>

                {/* Progress Logger */}
                <div className="bg-white border-4 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                   <h3 className="font-black uppercase tracking-widest text-gray-400 text-sm mb-4">Pages To Log</h3>
                   
                   <div className="flex items-center justify-center gap-6 mb-8">
                      <button onClick={() => bumpPagesToAdd(-1)} className="bg-white border-4 border-black w-14 h-14 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                        <Minus size={24} className="font-black" />
                      </button>
                      <div className="text-center">
                        <span className="text-6xl font-black text-black leading-none">{pagesToAdd}</span>
                        <div className="font-black text-gray-300 text-xs uppercase tracking-tighter">PAGES READ</div>
                      </div>
                      <button onClick={() => bumpPagesToAdd(1)} className="bg-white border-4 border-black w-14 h-14 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                        <Plus size={24} className="font-black" />
                      </button>
                   </div>

                   <button 
                     onClick={handleUpdateProgress}
                     disabled={isUpdating || !canSaveProgress}
                     className="w-full bg-emerald-400 border-4 border-black py-4 rounded-[1.5rem] font-black text-white uppercase tracking-widest text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50"
                   >
                     {isUpdating ? "SAVING..." : "LOG PROGRESS"}
                   </button>
                </div>

                {/* Mini Trophy */}
                <div className="bg-rose-100 border-4 border-black rounded-[2rem] p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white border-4 border-black rounded-full flex items-center justify-center shrink-0">
                    <Trophy className="text-orange-400" />
                  </div>
                  <div>
                    <div className="font-black uppercase text-sm tracking-widest text-rose-500">Keep It Up!</div>
                    <div className="font-bold text-xs text-rose-400 uppercase">You're doing amazing, Hero!</div>
                  </div>
                </div>

                {/* AI Quiz Section */}
                <div className="bg-purple-100 border-4 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white border-4 border-black rounded-xl flex items-center justify-center">
                      <Sparkles className="text-purple-500" size={20} />
                    </div>
                    <h3 className="font-black uppercase tracking-widest text-black text-sm">Magic Quiz</h3>
                  </div>

                  {!quiz && !quizResult && (
                    <button 
                      onClick={handleGenerateQuiz}
                      disabled={isGeneratingQuiz}
                      className="w-full bg-white border-4 border-black py-3 rounded-xl font-black text-purple-600 uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-50 active:translate-y-1 active:shadow-none transition-all"
                    >
                      {isGeneratingQuiz ? "MAGIC IN PROGRESS..." : "GENERATE AI QUIZ"}
                    </button>
                  )}

                  {isGeneratingQuiz && (
                    <div className="py-4 text-center">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-[10px] font-black text-purple-600 uppercase">Gemini is thinking...</p>
                    </div>
                  )}

                  {quiz && (
                    <div className="space-y-6">
                      {quiz.questions.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-3">
                          <p className="font-black text-sm text-black uppercase leading-tight">{qIdx + 1}. {q.question}</p>
                          <div className="grid grid-cols-1 gap-2">
                            {q.options.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => {
                                  const newAns = [...quizAnswers];
                                  newAns[qIdx] = opt;
                                  setQuizAnswers(newAns);
                                }}
                                className={`text-left px-4 py-2 border-2 border-black rounded-xl text-xs font-bold transition-all ${quizAnswers[qIdx] === opt ? "bg-purple-500 text-white" : "bg-white text-gray-700 hover:bg-purple-50"}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmittingQuiz}
                        className="w-full bg-purple-500 border-4 border-black py-3 rounded-xl font-black text-white uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all mt-4"
                      >
                        {isSubmittingQuiz ? "MAGIC SUBMITTING..." : "FINISH QUIZ"}
                      </button>
                    </div>
                  )}

                  {quizResult && (
                    <div className="bg-white border-4 border-black rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-2">
                         <Trophy className="text-amber-400" size={32} />
                      </div>
                      <p className="font-black text-black uppercase text-sm mb-1">Adventure Results!</p>
                      <p className="font-bold text-purple-600 text-xs mb-3">{quizResult.correct} / {quizResult.total} CORRECT</p>
                      <div className="bg-rose-500 text-white font-black py-1 px-3 rounded-full text-[10px] inline-block mb-3">
                        +{quizResult.points} XP EARNED
                      </div>
                      <button 
                        onClick={() => setQuizResult(null)}
                        className="block w-full text-[10px] font-black text-gray-400 uppercase hover:text-black"
                      >
                        TRY ANOTHER?
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReadingPage;
