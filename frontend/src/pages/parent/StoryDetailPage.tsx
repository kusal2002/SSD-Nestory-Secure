import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, Clock, ExternalLink, Tag, User } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import StoryService from '../../services/storyService';
import AssignmentService from '../../services/assignmentService';
import { useAuth } from '../../contexts/AuthContext';
import { Story } from '../../types';

const StoryDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { storyId } = useParams<{ storyId: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ageEmoji = useMemo(() => {
    switch (story?.ageGroup) {
      case 'toddler':
        return '👶';
      case 'early-reader':
        return '👧';
      case 'middle-grade':
        return '🧒';
      case 'young-adult':
        return '👦';
      default:
        return '📚';
    }
  }, [story?.ageGroup]);

  useEffect(() => {
    const loadStory = async () => {
      if (!storyId) {
        toast.error('Invalid story id');
        navigate(user?.role === 'child' ? '/child' : '/stories');
        return;
      }

      try {
        setIsLoading(true);
        const storyData = await StoryService.getStoryById(storyId);

        if (user?.role === 'child') {
          const assignments = await AssignmentService.getMyAssignments().catch(() => []);
          const sid = String(storyId);
          const allowed = assignments.some(
            (a) =>
              a.status !== 'completed' &&
              sid === String(a.storyId || a.story?._id || a.story?.id || ''),
          );
          if (!allowed) {
            toast.error('This book is not assigned to you.');
            navigate('/child');
            return;
          }
        }

        setStory(storyData);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load story');
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [navigate, storyId, user?.role]);

  if (isLoading) {
    return (
      <div className="container-responsive py-20 text-center">
        <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Gathering story details...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="container-responsive py-20">
        <div className="card text-center py-12 shadow-2xl rounded-[2rem]">
          <p className="text-gray-600 mb-6 font-medium text-lg">Story not found</p>
          <button onClick={() => navigate('/stories')} className="btn-primary px-8">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container-responsive py-8 max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/stories')}
          className="group mb-8 flex items-center gap-2 text-gray-500 hover:text-nestory-600 font-bold transition-all text-sm uppercase tracking-widest"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Library
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual & Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-nestory-100 border border-gray-100">
              <div className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-nestory-50 to-blue-50 flex items-center justify-center text-8xl mb-8 shadow-inner border border-nestory-100/50">
                {ageEmoji}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Tag size={20} className="text-nestory-600" />
                    <span className="font-bold text-gray-700">Level</span>
                  </div>
                  <span className="bg-nestory-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-tighter">
                    {story.readingLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-nestory-600" />
                    <span className="font-bold text-gray-700">Length</span>
                  </div>
                  <span className="text-gray-900 font-black">{story.pageCount || '—'} pgs</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Clock size={20} className="text-nestory-600" />
                    <span className="font-bold text-gray-700">Source</span>
                  </div>
                  <span className="text-gray-900 font-black uppercase text-[10px] tracking-tight truncate max-w-[100px] bg-gray-200 px-2 py-1 rounded">
                    {story.source || 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white shadow-xl">
              <h3 className="text-xl font-black mb-2 leading-tight">Ready to Read?</h3>
              <p className="text-sm opacity-80 font-medium mb-6 leading-relaxed">
                Assign this story to your child to start tracking their progress and earning rewards!
              </p>
              <button 
                onClick={() => navigate(`/assignments/new?storyId=${storyId}`)}
                className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-black shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95"
              >
                Create Assignment
              </button>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-nestory-100 border border-gray-100">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
                {story.title}
              </h1>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                  <User size={18} className="text-nestory-600" />
                  <span className="text-sm font-bold text-gray-700">{story.author}</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase tracking-wider">
                    {story.ageGroup}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-10">
                {(story.genres || []).map((genre) => (
                  <span key={genre} className="px-4 py-2 bg-nestory-50 text-nestory-700 rounded-xl text-xs font-bold border border-nestory-100">
                    #{genre}
                  </span>
                ))}
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-nestory-100 flex items-center justify-center">
                      <BookOpen size={18} className="text-nestory-600" />
                    </div>
                    Synopsis
                  </h2>
                  <div className="prose prose-nestory max-w-none">
                    <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line font-medium italic">
                      {story.description || 'No description available for this story. Dive in to discover a world of wonder and learning!'}
                    </p>
                  </div>
                </div>

                {story.previewLink && (
                  <div className="pt-8 border-t border-gray-100">
                    <a
                      href={story.previewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:bg-black transition-all transform hover:-translate-y-1"
                    >
                      <ExternalLink size={20} />
                      Full Preview Online
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested / Similar section placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100">
                <h4 className="font-extrabold text-amber-900 mb-2 italic">Why this book?</h4>
                <p className="text-sm text-amber-800/80 font-medium leading-relaxed">
                  Based on reading levels, this book is perfect for building vocabulary and narrative understanding for {story.ageGroup}s.
                </p>
              </div>
              <div className="p-8 rounded-[2rem] bg-cyan-50 border border-cyan-100">
                <h4 className="font-extrabold text-cyan-900 mb-2 italic">Parent Tip</h4>
                <p className="text-sm text-cyan-800/80 font-medium leading-relaxed">
                  Try asking your child what they think the characters might do next after every second chapter!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetailPage;