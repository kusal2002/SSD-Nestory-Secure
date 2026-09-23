import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Book, CalendarDays, CheckCircle2, Flame, Hourglass, UserCircle2 } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import ChildService from '../../services/childService';
import AssignmentService from '../../services/assignmentService';
import ReadingService from '../../services/readingService';
import { Assignment, Child } from '../../types';

const ChildDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { childId } = useParams<{ childId: string }>();

  const [child, setChild] = useState<Child | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all');

  const assignmentStats = useMemo(() => {
    const assigned = assignments.filter((item) => item.status === 'assigned').length;
    const inProgress = assignments.filter((item) => item.status === 'in_progress').length;
    const completed = assignments.filter((item) => item.status === 'completed').length;
    return {
      total: assignments.length,
      assigned,
      inProgress,
      completed,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'all') return assignments;
    return assignments.filter((item) => item.status === statusFilter);
  }, [assignments, statusFilter]);

  useEffect(() => {
    const loadChildData = async () => {
      if (!childId) {
        toast.error('Invalid child id');
        navigate('/dashboard');
        return;
      }

      try {
        setIsLoading(true);

        const [childData, assignmentData, weeklyData, streakData] = await Promise.all([
          ChildService.getChildById(childId),
          AssignmentService.getChildAssignments(childId),
          ReadingService.getWeeklyReadingTime(childId).catch(() => ({ totalTime: 0, unit: 'minutes' })),
          ReadingService.getReadingStreak(childId).catch(() => ({ streak: 0, longestStreak: 0 })),
        ]);

        setChild(childData);
        setAssignments(assignmentData);
        setWeeklyMinutes(Number(weeklyData.totalTime) || 0);
        setCurrentStreak(Number(streakData.streak) || 0);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load child details');
      } finally {
        setIsLoading(false);
      }
    };

    loadChildData();
  }, [childId, navigate]);

  if (isLoading) {
    return (
      <div className="container-responsive py-20 text-center">
        <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium tracking-tight">Loading child dashboard...</p>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="container-responsive py-20">
        <div className="card text-center py-12 rounded-[2rem] shadow-2xl">
          <p className="text-gray-600 mb-6 font-bold text-lg">Child not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary px-8">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container-responsive py-8 max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="group mb-8 flex items-center gap-2 text-gray-500 hover:text-nestory-600 font-bold transition-all text-sm uppercase tracking-widest"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header Profile Card */}
        <div className="bg-white rounded-[2.5rem] p-8 mb-10 shadow-2xl shadow-nestory-100 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-nestory-50 rounded-full -mr-32 -mt-32 opacity-50" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-br from-nestory-100 to-blue-100 flex items-center justify-center text-5xl md:text-6xl shadow-inner border-2 border-white">
              {child.avatar || '🧒'}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-none mb-3">
                {child.name}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <span className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-sm font-black uppercase tracking-tighter">
                  Age {child.age}
                </span>
                <span className="px-4 py-1.5 bg-nestory-100 text-nestory-700 rounded-full text-sm font-black uppercase tracking-tighter">
                  {child.readingLevel || 'Beginner Reader'}
                </span>
              </div>
            </div>
            
            <div className="md:ml-auto flex gap-4">
              <button 
                onClick={() => navigate(`/assignments/new?childId=${childId}`)}
                className="px-6 py-3 bg-nestory-600 text-white rounded-2xl font-black shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 text-sm"
              >
                + New Assignment
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <Book size={24} className="text-blue-600" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned</p>
            <p className="text-3xl font-black text-gray-900">{assignmentStats.assigned}</p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
              <Hourglass size={24} className="text-amber-600" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active</p>
            <p className="text-3xl font-black text-gray-900">{assignmentStats.inProgress}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Finished</p>
            <p className="text-3xl font-black text-gray-900">{assignmentStats.completed}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
              <Flame size={24} className="text-orange-600" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Streak</p>
            <p className="text-3xl font-black text-gray-900">{currentStreak || 0}d</p>
          </div>

          <div className="bg-gradient-to-br from-nestory-600 to-indigo-700 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
              <CalendarDays size={24} className="text-white" />
            </div>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">This Week</p>
            <p className="text-3xl font-black">{weeklyMinutes || 0}m</p>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-nestory-100 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-nestory-100 flex items-center justify-center">
                  <Book size={22} className="text-nestory-600" />
                </div>
                Current Journey
              </h2>
              <p className="text-gray-500 font-medium mt-1">Tracks and upcoming milestones for {child.name}.</p>
            </div>

            <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              {(['all', 'assigned', 'in_progress', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    statusFilter === filter
                      ? 'bg-white text-gray-900 shadow-md scale-105 border border-gray-100'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Book className="text-gray-300" size={32} />
              </div>
              <p className="text-gray-400 font-bold text-lg italic">No stories found in this category.</p>
              <button 
                onClick={() => navigate('/stories')}
                className="mt-4 text-nestory-600 font-black text-sm uppercase tracking-widest hover:underline"
              >
                Browse Story Library →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="group bg-white border border-gray-100 rounded-[2rem] p-6 flex flex-col justify-between gap-6 hover:shadow-2xl transition-all hover:-translate-y-1 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-2 h-full ${
                    assignment.status === 'completed' ? 'bg-green-500' : 
                    assignment.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-2xl font-black text-gray-900 leading-tight group-hover:text-nestory-700 transition-colors">
                        {assignment.story?.title || 'Untitled story'}
                      </p>
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        assignment.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {assignment.status.replace('_', ' ')}
                      </div>
                    </div>
                    
                    <p className="text-sm font-bold text-gray-500 flex items-center gap-2 mb-6">
                      <UserCircle2 size={14} />
                      {assignment.story?.author || 'Unknown author'}
                    </p>

                    <div className="flex items-center gap-3">
                      {assignment.story?.readingLevel ? (
                        <span className="px-3 py-1 bg-nestory-50 text-nestory-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-nestory-100">
                          {assignment.story.readingLevel}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          Not set
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-tighter">
                      <CalendarDays size={14} className="text-nestory-400" />
                      {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No date'}
                    </div>
                    <button 
                      onClick={() => navigate(`/assignments/progress/${assignment.id}`)}
                      className="text-nestory-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform"
                    >
                      View Stats →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildDetailPage;