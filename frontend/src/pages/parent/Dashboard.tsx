import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import StatCard from '../../components/common/StatCard';
import ChildCard from '../../components/common/ChildCard';
import Modal from '../../components/common/Modal';
import InputField from '../../components/common/InputField';
import SelectField from '../../components/common/SelectField';
import ParentSidebar from '../../components/common/ParentSidebar';
import FamilyService from '../../services/familyService';
import ChildService from '../../services/childService';
import DashboardService from '../../services/dashboardService';
import ReadingService from '../../services/readingService';
import chatService from '../../services/chatService';
import CreateAssignmentModal from '../../components/assignments/CreateAssignmentModal';
import toast from 'react-hot-toast';
import {
  Book,
  Users,
  TrendingUp,
  Clock,
  Plus,
  AlertCircle,
  Home,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Copy,
  BarChart3,
  MessageCircle,
} from 'lucide-react';
import { Family, Child, ChildAccountCredentials, ReadingActivitySummary } from '../../types';
import ReadingWeeklyBarChart from '../../components/progress/ReadingWeeklyBarChart';

type ChildReadingLevel = NonNullable<Child['readingLevel']>;

const avatarEmojiRegex = /^(\p{Extended_Pictographic}|\uFE0F|\u200D)+$/u;

const isValidAvatar = (value: string) => {
  if (!value.trim()) return true;

  const isUrl = /^https?:\/\//i.test(value);
  if (isUrl) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  return avatarEmojiRegex.test(value.trim());
};

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Just now';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const deltaMs = Date.now() - timestamp;
  const deltaMinutes = Math.max(Math.floor(deltaMs / 60000), 0);

  if (deltaMinutes < 1) return 'Just now';
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
};

const ParentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [familyNameError, setFamilyNameError] = useState('');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'add-child') {
      setShowAddChildModal(true);
    }
  }, [location]);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [deletingChildId, setDeletingChildId] = useState('');
  const [resettingChildId, setResettingChildId] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newChildCredentials, setNewChildCredentials] = useState<ChildAccountCredentials | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    totalAssignments: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    completionRate: 0,
  });
  const [readingStats, setReadingStats] = useState({
    weeklyMinutes: 0,
    topStreak: 0,
  });
  const [recentAssignments, setRecentAssignments] = useState<Array<{
    id: string;
    childId: string;
    childAvatar?: string;
    childName: string;
    storyTitle: string;
    status: string;
    dueDate?: string;
    createdAt?: string;
  }>>([]);
  const [recentCompletions, setRecentCompletions] = useState<Array<{
    id: string;
    childId: string;
    childAvatar?: string;
    childName: string;
    storyTitle: string;
    status: string;
    completedAt?: string;
  }>>([]);
  const [childPerformance, setChildPerformance] = useState<Array<{
    id: string;
    childId: string;
    name: string;
    avatar: string;
    assignments: {
      total: number;
      assigned: number;
      inProgress: number;
      completed: number;
      completionRate: number;
    };
  }>>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
  const [weekActivity, setWeekActivity] = useState<ReadingActivitySummary | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    age: number;
    avatar: string;
    readingLevel: ChildReadingLevel | 'beginner' | 'intermediate' | 'advanced';
    email?: string;
  }>({
    name: '',
    age: 5,
    avatar: '👧',
    readingLevel: 'beginner',
    email: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateChildForm = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedAvatar = formData.avatar.trim();
    const trimmedEmail = formData.email?.trim() || '';

    if (!trimmedName) {
      newErrors.name = 'Child name is required';
    } else if (trimmedName.length < 2 || trimmedName.length > 50) {
      newErrors.name = 'Child name must be between 2 and 50 characters';
    }

    if (!Number.isInteger(formData.age) || formData.age < 1 || formData.age > 17) {
      newErrors.age = 'Age must be a whole number between 1 and 17';
    }

    if (trimmedAvatar.length > 2048) {
      newErrors.avatar = 'Avatar must be 2048 characters or less';
    } else if (!isValidAvatar(trimmedAvatar)) {
      newErrors.avatar = 'Avatar must be an emoji or a valid http/https URL';
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Please provide a valid email address';
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetDashboardData = () => {
    setChildren([]);
    setSummaryStats({ totalAssignments: 0, assigned: 0, inProgress: 0, completed: 0, completionRate: 0 });
    setReadingStats({ weeklyMinutes: 0, topStreak: 0 });
    setRecentAssignments([]);
    setRecentCompletions([]);
    setChildPerformance([]);
    setLastUpdatedAt('');
    setWeekActivity(null);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setLoadError('');

      let familyData: Family | null = null;

      try {
        familyData = await FamilyService.getMyFamily();
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setFamily(null);
          resetDashboardData();
          return;
        }
        throw error;
      }

      setFamily(familyData);

      // Load unread messages
      try {
        const unreadCount = await chatService.getUnread();
        setUnreadMessages(unreadCount);
      } catch (error) {
        console.error('Failed to load unread messages:', error);
      }

      const [childrenData, summaryData, familyDashboardData] = await Promise.all([
        ChildService.getChildren(),
        DashboardService.getFamilySummary().catch(() => null),
        DashboardService.getFamilyDashboard().catch(() => null),
      ]);

      setChildren(childrenData);

      const statsFromDashboard = familyDashboardData?.overallStats;
      if (statsFromDashboard) {
        setSummaryStats({
          totalAssignments: Number(statsFromDashboard.total) || 0,
          assigned: Number(statsFromDashboard.assigned) || 0,
          inProgress: Number(statsFromDashboard.inProgress) || 0,
          completed: Number(statsFromDashboard.completed) || 0,
          completionRate: Number(statsFromDashboard.completionRate) || 0,
        });
      } else if (summaryData) {
        setSummaryStats({
          totalAssignments: Number(summaryData.totalAssignments) || 0,
          assigned: Number(summaryData.assigned) || 0,
          inProgress: Number(summaryData.inProgress) || 0,
          completed: Number(summaryData.completed) || 0,
          completionRate: Number(summaryData.completionRate) || 0,
        });
      } else {
        setSummaryStats({ totalAssignments: 0, assigned: 0, inProgress: 0, completed: 0, completionRate: 0 });
      }

      const rawRecent = familyDashboardData?.recentAssignments || [];
      setRecentAssignments(
        rawRecent.map((item) => ({
          id: item.id,
          childId: item.child?.id || item.childId,
          childAvatar: item.child?.avatar,
          childName: item.child?.name || 'Unknown child',
          storyTitle: item.story?.title || 'Untitled story',
          status: item.status || 'assigned',
          dueDate: item.dueDate,
          createdAt: item.createdAt,
        }))
      );

      const rawCompletions = familyDashboardData?.recentCompletions || [];
      setRecentCompletions(
        rawCompletions.map((item) => ({
          id: item.id,
          childId: item.child?.id || item.childId,
          childAvatar: item.child?.avatar,
          childName: item.child?.name || 'Unknown child',
          storyTitle: item.story?.title || 'Untitled story',
          status: item.status || 'completed',
          completedAt: item.completedAt,
        }))
      );

      const childCards = familyDashboardData?.children || [];
      setChildPerformance(
        childCards.map((child) => ({
          id: child.id,
          childId: child.childId || child.id,
          name: child.name,
          avatar: child.avatar || '🧒',
          assignments: {
            total: Number(child.assignments.total) || 0,
            assigned: Number(child.assignments.assigned) || 0,
            inProgress: Number(child.assignments.inProgress) || 0,
            completed: Number(child.assignments.completed) || 0,
            completionRate: Number(child.assignments.completionRate) || 0,
          },
        }))
      );

      if (childrenData.length > 0) {
        const readingData = await Promise.all(
          childrenData.map(async (child: Child) => {
            const [weekly, streak] = await Promise.all([
              ReadingService.getWeeklyReadingTime(child.id).catch(() => ({ totalTime: 0 })),
              ReadingService.getReadingStreak(child.id).catch(() => ({ streak: 0 })),
            ]);

            return {
              weeklyMinutes: Number(weekly?.totalTime) || 0,
              streak: Number(streak?.streak) || 0,
            };
          })
        );

        const totalWeekly = readingData.reduce((sum, item) => sum + item.weeklyMinutes, 0);
        const topStreak = readingData.reduce((max, item) => Math.max(max, item.streak), 0);
        setReadingStats({ weeklyMinutes: totalWeekly, topStreak });
      } else {
        setReadingStats({ weeklyMinutes: 0, topStreak: 0 });
      }

      if (childrenData.length > 0) {
        try {
          const wa = await ReadingService.getFamilyActivitySummary(7);
          setWeekActivity(wa);
        } catch {
          setWeekActivity(null);
        }
      } else {
        setWeekActivity(null);
      }

      setLastUpdatedAt(new Date().toISOString());
    } catch (error: any) {
      setLoadError(error?.response?.data?.message || 'Failed to load family data. Please try again.');
      resetDashboardData();
      setFamily(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFamily = async () => {
    const trimmedFamilyName = newFamilyName.trim();

    if (!trimmedFamilyName) {
      setFamilyNameError('Family name is required');
      return;
    }

    if (trimmedFamilyName.length < 2 || trimmedFamilyName.length > 100) {
      setFamilyNameError('Family name must be between 2 and 100 characters');
      return;
    }

    try {
      setIsCreatingFamily(true);
      const createdFamily = await FamilyService.createFamily({ familyName: trimmedFamilyName });
      setFamily(createdFamily);
      setFamilyNameError('');
      setNewFamilyName('');
      toast.success('Family created successfully');
      await loadData();
    } catch (error: any) {
      setFamilyNameError(error?.response?.data?.message || 'Failed to create family');
    } finally {
      setIsCreatingFamily(false);
    }
  };

  const handleAddChild = async () => {
    if (!family?.id) {
      toast.error('Create a family group before adding children');
      return;
    }

    if (!validateChildForm()) {
      toast.error('Please correct the highlighted fields');
      return;
    }

    try {
      setIsSavingChild(true);
      const payload: any = {
        name: formData.name.trim(),
        age: formData.age,
        avatar: formData.avatar.trim(),
        readingLevel: formData.readingLevel,
      };

      if (formData.email?.trim()) {
        payload.email = formData.email.trim();
      }

      if (editingChild) {
        const updated = await ChildService.updateChild(editingChild.id, {
          ...payload,
        });
        setChildren(children.map(c => c.id === editingChild.id ? updated : c));
        toast.success('Child updated successfully');
      } else {
        const addChildResponse = await ChildService.addChild({
          ...payload,
          family: family.id,
        });
        const newChild = addChildResponse.child;
        setChildren([...children, newChild]);
        setNewChildCredentials(addChildResponse.credentials);
        setShowCredentialsModal(true);
        toast.success('Child added successfully');
      }

      // Reset form and close modal
      setFormData({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner', email: '' });
      setShowAddChildModal(false);
      setEditingChild(null);
      setFormErrors({});
      await loadData();
    } catch (error: any) {
      const backendErrors = error?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const mapped: Record<string, string> = {};
        backendErrors.forEach((item: any) => {
          if (item?.field && item?.message) {
            mapped[item.field] = item.message;
          }
        });
        if (Object.keys(mapped).length > 0) {
          setFormErrors((prev) => ({ ...prev, ...mapped }));
        }
      }

      toast.error(error?.response?.data?.message || 'Failed to save child');
    } finally {
      setIsSavingChild(false);
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setFormErrors({});
    setFormData({
      name: child.name,
      age: child.age,
      avatar: child.avatar || '👧',
      readingLevel: child.readingLevel || 'beginner',
      email: child.email || '',
    });
    setShowAddChildModal(true);
  };

  const handleDeleteChild = async (childId: string) => {
    if (!window.confirm('Are you sure you want to delete this child?')) return;

    try {
      setDeletingChildId(childId);
      await ChildService.deleteChild(childId);
      setChildren(children.filter(c => c.id !== childId));
      toast.success('Child deleted successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete child');
    } finally {
      setDeletingChildId('');
    }
  };

  const handleCloseModal = () => {
    setShowAddChildModal(false);
    setEditingChild(null);
    setFormErrors({});
    setFormData({ name: '', age: 5, avatar: '👧', readingLevel: 'beginner', email: '' });
  };

  const handleResetChildPassword = async (childId: string) => {
    const selectedChild = children.find((item) => item.id === childId);
    const childName = selectedChild?.name || 'this child';

    if (!window.confirm(`Reset password for ${childName}?`)) return;

    try {
      setResettingChildId(childId);
      const response = await ChildService.resetChildPassword(childId);
      setNewChildCredentials(response.credentials);
      setShowCredentialsModal(true);
      toast.success(`Password reset for ${childName}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reset child password');
    } finally {
      setResettingChildId('');
    }
  };

  const handleCloseCredentialsModal = () => {
    setShowCredentialsModal(false);
    setNewChildCredentials(null);
  };

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) {
      toast.error(`No ${label.toLowerCase()} available to copy`);
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const avatarEmojis = ['👧', '👦', '🧒', '👨', '👩', '🤓', '😊', '🎒'];
  const readingLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const parseReadingLevel = (value: string): ChildReadingLevel => {
    if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
      return value;
    }
    return 'beginner';
  };

  // Set up polling for unread messages
  useEffect(() => {
    if (!family) return;

    const interval = setInterval(async () => {
      try {
        const unreadCount = await chatService.getUnread();
        setUnreadMessages(unreadCount);
      } catch (error) {
        console.error('Failed to check unread messages:', error);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [family]);

  const outstandingAssignments = summaryStats.assigned + summaryStats.inProgress;
  const completionProgress =
    summaryStats.totalAssignments > 0
      ? Math.min(Math.round((summaryStats.completed / summaryStats.totalAssignments) * 100), 100)
      : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Dashboard" />
        <div className="container-responsive py-8 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your family data...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Dashboard" />
        <div className="container-responsive py-10">
          <div className="card max-w-2xl mx-auto text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-red-600" size={36} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load your dashboard</h2>
            <p className="text-gray-600 mb-6">{loadError}</p>
            <div className="flex justify-center gap-3">
              <button onClick={loadData} className="btn-primary">Try Again</button>
              <button onClick={() => navigate('/family-settings')} className="btn-secondary">Family Settings</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Dashboard" />
        <div className="container-responsive py-10">
          <div className="card max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-nestory-100 flex items-center justify-center">
                <Home className="text-nestory-700" size={22} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Family Group</h1>
                <p className="text-gray-600">To add children, assign stories, and track reading progress, start by creating your family profile.</p>
              </div>
            </div>

            <div className="space-y-4">
              <InputField
                label="Family Name"
                name="familyName"
                value={newFamilyName}
                onChange={(e) => {
                  setNewFamilyName(e.target.value);
                  if (familyNameError) setFamilyNameError('');
                }}
                placeholder="e.g., The Silva Family"
                error={familyNameError}
                required
              />

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCreateFamily}
                  className="btn-primary"
                  disabled={isCreatingFamily}
                >
                  {isCreatingFamily ? 'Creating Family...' : 'Create Family'}
                </button>
                <button
                  onClick={() => navigate('/family-settings')}
                  className="btn-secondary"
                >
                  Open Family Settings
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Backend rules: only parents can manage families, and each parent can have only one family group.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <ParentSidebar 
        onAddChild={() => setShowAddChildModal(true)} 
        onNewAssignment={() => setShowNewAssignmentModal(true)}
        unreadMessages={unreadMessages} 
      />
      <Navbar title="Dashboard" />

      <div className="container-responsive py-8 px-4 lg:px-8 max-w-7xl mx-auto" aria-label="Parent Dashboard Content">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight lg:text-5xl mb-2">Parent Dashboard</h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-nestory-100 text-nestory-700">
                   {family?.familyName || 'Your Family'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 font-medium">{children.length} {children.length === 1 ? 'child' : 'children'}</span>
              </div>
              {lastUpdatedAt && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Clock size={12} />
                  Last updated {new Date(lastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 animate-slide-down">
              <button
                onClick={() => loadData()}
                className="btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
            <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
              <StatCard
                title="Assigned"
                value={summaryStats.assigned}
                icon={Book}
                color="blue"
                subtext="Pending to start"
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
              <StatCard
                title="In Progress"
                value={summaryStats.inProgress}
                icon={TrendingUp}
                color="orange"
                subtext="Currently reading"
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <StatCard
                title="Completed"
                value={summaryStats.completed}
                icon={CheckCircle2}
                color="green"
                subtext={`${summaryStats.totalAssignments} total`}
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <StatCard
                title="Success Rate"
                value={`${summaryStats.completionRate}%`}
                icon={Users}
                color="purple"
                subtext="Completion rate"
              />
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <StatCard
                title="Reading Time"
                value={(readingStats.weeklyMinutes / 60).toFixed(1)}
                icon={Clock}
                color="pink"
                subtext="Hours this week"
              />
            </div>
          </div>

          {/* Momentum Banner */}
          <div className="card mb-8 p-6 md:p-8 bg-gradient-to-br from-nestory-600 to-nestory-800 text-white border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 -m-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex-1">
                <p className="text-nestory-200 font-bold uppercase tracking-wider text-xs mb-2">FAMILY MOMENTUM</p>
                <h2 className="text-3xl font-extrabold mb-2">Keep the reading flame alive! 🔥</h2>
                <p className="text-nestory-100 max-w-xl">
                  Your family has completed <span className="text-white font-bold">{summaryStats.completed}</span> stories. 
                  There are <span className="text-white font-bold">{outstandingAssignments}</span> adventures currently in progress. 
                  Great job keeping it consistent!
                </p>
              </div>
              <div className="min-w-[280px] bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-bold">Overall Progress</span>
                  <span className="font-black text-xl">{completionProgress}%</span>
                </div>
                <div className="h-4 bg-white/20 rounded-full overflow-hidden p-1">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                    style={{ width: `${completionProgress}%` }} 
                  />
                </div>
                <p className="text-[10px] mt-2 text-nestory-200 text-center font-bold">REACH 100% FOR A FAMILY BADGE</p>
              </div>
            </div>
          </div>

          {weekActivity && children.length > 0 && (
            <div className="card mb-8 p-0 overflow-hidden border-nestory-100 bg-white">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="text-nestory-600" size={24} />
                    Weekly Achievement Report
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Tracking progress from {new Date(weekActivity.periodStart).toLocaleDateString()} to {new Date(weekActivity.periodEnd).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary-outline text-sm font-bold bg-white"
                  onClick={() => navigate('/progress')}
                >
                  Detail View
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                       <Book size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900 leading-none">{weekActivity.totalPagesLogged}</p>
                      <p className="text-[10px] font-bold text-blue-700 uppercase mt-1">Pages Logged</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                       <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900 leading-none">{weekActivity.totalMinutesLogged}</p>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase mt-1">Minutes Read</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                       <RefreshCw size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900 leading-none">{weekActivity.progressSaveCount}</p>
                      <p className="text-[10px] font-bold text-amber-700 uppercase mt-1">Active Sessions</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                       <Users size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900 leading-none">
                        {weekActivity.byChild?.filter((c) => c.progressSaveCount > 0).length ?? 0}
                      </p>
                      <p className="text-[10px] font-bold text-purple-700 uppercase mt-1">Active Kids</p>
                    </div>
                  </div>
                </div>

                {weekActivity.byDay && weekActivity.byDay.length > 0 ? (
                  <div className="rounded-2xl border border-gray-100 p-6 bg-gray-50/30">
                    <ReadingWeeklyBarChart
                      byDay={weekActivity.byDay}
                      title="Daily Engagement Momentum"
                    />
                  </div>
                ) : null}

                {weekActivity.byChild && weekActivity.byChild.length > 0 && (
                  <div className="mt-8">
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 px-2">Performance by Child</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {weekActivity.byChild.map((c) => (
                        <div key={c.childId} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 group hover:border-nestory-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-nestory-50 flex items-center justify-center text-lg font-bold border border-nestory-100 group-hover:scale-110 transition-transform">
                               {c.childName.charAt(0)}
                            </div>
                            <div>
                               <p className="font-bold text-gray-900">{c.childName}</p>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{c.progressSaveCount} total saves</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-gray-900">{c.minutes} <span className="text-[10px] text-gray-400 font-bold">MIN</span></p>
                             <p className="text-xs text-nestory-600 font-bold">{c.pages} pages</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Child Performance Insights */}
          <div className="mb-10 animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Child Success Center</h2>
                <p className="text-sm text-gray-500 font-medium">Deeper engagement analytics</p>
              </div>
              <button 
                onClick={() => navigate('/assignments')} 
                className="text-sm font-bold text-nestory-600 hover:text-nestory-700 flex items-center gap-1 group"
              >
                Detailed Tracking <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {childPerformance.length === 0 ? (
              <div className="card text-center py-16 bg-white flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                   <Users className="text-gray-300" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Performance Data Yet</h3>
                <p className="text-gray-500 max-w-sm mb-6">Start by adding a child and assigning their first story to unlock these insights.</p>
                <button onClick={() => setShowAddChildModal(true)} className="btn-primary font-bold">Get Started Now</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {childPerformance.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/child/${item.childId}`)}
                    className="group text-left rounded-3xl border-2 border-transparent bg-white shadow-md hover:shadow-2xl p-6 hover:border-nestory-400 transition-all duration-300 transform hover:scale-[1.03] animate-scale-in flex flex-col h-full"
                    style={{ animationDelay: `${idx * 75}ms` }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nestory-400 to-nestory-600 flex items-center justify-center text-3xl shadow-lg ring-4 ring-nestory-50 group-hover:scale-110 transition-transform">
                        {item.avatar || '🧒'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-xl truncate tracking-tight">{item.name}</p>
                        <p className="text-xs text-nestory-600 font-bold uppercase tracking-widest">{item.assignments.total} Stories</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-8">
                      <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100 flex flex-col items-center">
                        <p className="text-[10px] font-bold text-blue-800 uppercase mb-1">Assigned</p>
                        <p className="font-black text-xl text-blue-900">{item.assignments.assigned}</p>
                      </div>
                      <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100 flex flex-col items-center">
                        <p className="text-[10px] font-bold text-amber-800 uppercase mb-1">Active</p>
                        <p className="font-black text-xl text-amber-900">{item.assignments.inProgress}</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100 flex flex-col items-center">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1">Done</p>
                        <p className="font-black text-xl text-emerald-900">{item.assignments.completed}</p>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Mastery Rate</p>
                        <span className="font-black text-gray-900">{item.assignments.completionRate}%</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-nestory-400 to-nestory-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,160,122,0.4)]"
                          style={{ width: `${Math.min(item.assignments.completionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Members & Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 animate-slide-up">
            {/* Family Members */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Family Members</h2>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-tight">{children.length} ACTIVE PROFILES</p>
                </div>
                <button
                  onClick={() => setShowAddChildModal(true)}
                  className="w-12 h-12 rounded-2xl bg-nestory-600 text-white flex items-center justify-center hover:bg-nestory-700 shadow-xl shadow-nestory-100 transition-all hover:scale-110"
                  disabled={!family}
                  title="Add New Child"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>

              {children.length === 0 ? (
                <div className="card p-10 bg-white border-dashed border-2 border-gray-200 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     <Plus className="text-gray-300" size={32} />
                  </div>
                  <p className="text-gray-500 font-bold mb-4">You haven't added any children yet</p>
                  <button
                    onClick={() => setShowAddChildModal(true)}
                    className="btn-primary px-8 font-black"
                  >
                    ADD YOUR FIRST CHILD
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {children.map((child) => {
                    const cid = String(child.id || child._id || '');
                    const perf = childPerformance.find(
                      (p) => String(p.childId) === cid || String(p.id) === cid,
                    );
                    const assignedStoryCount = perf?.assignments.total ?? 0;
                    return (
                    <ChildCard
                      key={child.id}
                      child={child}
                      assignedStoryCount={assignedStoryCount}
                      onEdit={handleEditChild}
                      onResetPassword={handleResetChildPassword}
                      onDelete={handleDeleteChild}
                      isDeleting={deletingChildId === child.id}
                      isResettingPassword={resettingChildId === child.id}
                      onClick={() => navigate(`/child/${child.id}`)}
                    />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity Split View */}
            <div className="space-y-6">
               <div className="card border-0 shadow-lg bg-white overflow-hidden">
                 <div className="bg-blue-600/5 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                    <h3 className="font-black text-gray-900 flex items-center gap-2">
                       <Book className="text-blue-600" size={18} />
                       RECENT ASSIGNMENTS
                    </h3>
                    <button onClick={() => navigate('/assignments')} className="text-xs font-bold text-blue-600 hover:underline">VIEW ALL</button>
                 </div>
                 <div className="p-4">
                   {recentAssignments.length === 0 ? (
                     <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-xs font-bold text-gray-400">NO ACTIVITY YET</p>
                     </div>
                   ) : (
                     <div className="space-y-2">
                       {recentAssignments.slice(0, 3).map((activity, idx) => (
                         <div
                           key={activity.id}
                           className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-50 hover:border-blue-200 transition-colors group cursor-pointer"
                           onClick={() => navigate(`/child/${activity.childId}`)}
                         >
                           <div className="flex items-center gap-3">
                              <span className="text-2xl group-hover:scale-125 transition-transform">{activity.childAvatar || '🧒'}</span>
                              <div>
                                <p className="text-sm font-bold text-gray-900 leading-tight">{activity.childName}</p>
                                <p className="text-[10px] text-gray-500 font-bold truncate max-w-[150px]">{activity.storyTitle}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-700 uppercase tracking-tighter">
                                {activity.status}
                              </span>
                              <p className="text-[9px] text-gray-400 font-medium mt-1 uppercase">{formatRelativeTime(activity.createdAt)}</p>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>

               <div className="card border-0 shadow-lg bg-white overflow-hidden">
                 <div className="bg-emerald-600/5 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
                    <h3 className="font-black text-gray-900 flex items-center gap-2">
                       <CheckCircle2 className="text-emerald-600" size={18} />
                       RECENT COMPLETIONS
                    </h3>
                    <button onClick={() => navigate('/progress')} className="text-xs font-bold text-emerald-600 hover:underline">SUCCESS LOG</button>
                 </div>
                 <div className="p-4">
                   {recentCompletions.length === 0 ? (
                     <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-xs font-bold text-gray-400">NO COMPLETIONS YET</p>
                     </div>
                   ) : (
                     <div className="space-y-2">
                       {recentCompletions.slice(0, 3).map((activity, idx) => (
                         <div
                           key={activity.id}
                           className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-50 hover:border-emerald-200 transition-colors group cursor-pointer"
                           onClick={() => navigate(`/child/${activity.childId}`)}
                         >
                           <div className="flex items-center gap-3">
                              <span className="text-2xl group-hover:scale-125 transition-transform">{activity.childAvatar || '🧒'}</span>
                              <div>
                                <p className="text-sm font-bold text-gray-900 leading-tight">{activity.childName}</p>
                                <p className="text-[10px] text-gray-500 font-bold truncate max-w-[150px]">{activity.storyTitle}</p>
                              </div>
                           </div>
                           <div className="text-right flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                 <CheckCircle2 size={16} strokeWidth={3} />
                              </div>
                              <ChevronRight size={14} className="text-gray-300" />
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Child Modal */}
      <Modal
        isOpen={showAddChildModal}
        title={editingChild ? 'Edit Child' : 'Add New Child'}
        onClose={handleCloseModal}
        onConfirm={handleAddChild}
        confirmText={editingChild ? 'Update' : 'Add Child'}
        size="md"
        isLoading={isSavingChild}
      >
        <div className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Choose Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {avatarEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setFormData({ ...formData, avatar: emoji })}
                  type="button"
                  className={`text-3xl p-3 rounded-lg border-2 transition-all ${
                    formData.avatar === emoji
                      ? 'border-nestory-600 bg-nestory-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <InputField
            label="Child's Name"
            name="name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) {
                setFormErrors((prev) => ({ ...prev, name: '' }));
              }
            }}
            placeholder="e.g., Emma"
            error={formErrors.name}
            required
          />

          {/* Age */}
          <InputField
            label="Age"
            name="age"
            type="number"
            value={formData.age}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setFormData({ ...formData, age: Number.isNaN(value) ? 0 : value });
              if (formErrors.age) {
                setFormErrors((prev) => ({ ...prev, age: '' }));
              }
            }}
            min="1"
            max="17"
            error={formErrors.age}
            required
          />

          <InputField
            label="Avatar (Emoji or URL)"
            name="avatar"
            value={formData.avatar}
            onChange={(e) => {
              setFormData({ ...formData, avatar: e.target.value });
              if (formErrors.avatar) {
                setFormErrors((prev) => ({ ...prev, avatar: '' }));
              }
            }}
            placeholder="e.g., 👧 or https://example.com/avatar.png"
            error={formErrors.avatar}
          />

          {/* Email (Optional) */}
          <InputField
            label="Email (Optional)"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (formErrors.email) {
                setFormErrors((prev) => ({ ...prev, email: '' }));
              }
            }}
            placeholder="e.g., emma.doe@example.com (leave empty to auto-generate)"
            error={formErrors.email}
          />

          {/* Reading Level */}
          <SelectField
            label="Reading Level"
            name="readingLevel"
            value={formData.readingLevel}
            onChange={(e) => setFormData({ ...formData, readingLevel: parseReadingLevel(e.target.value) })}
            options={readingLevels}
          />
        </div>
      </Modal>

      <Modal
        isOpen={showCredentialsModal}
        title="Child Login Credentials"
        onClose={handleCloseCredentialsModal}
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Share these credentials with your child. They will be prompted to change this temporary password after first login.
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Login Email</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900 break-all">{newChildCredentials?.email}</p>
              <button
                type="button"
                className="btn-secondary whitespace-nowrap inline-flex items-center gap-2"
                onClick={() => copyToClipboard(newChildCredentials?.email || '', 'Email')}
              >
                <Copy size={16} />
                Copy
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Temporary Password</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">{newChildCredentials?.temporaryPassword}</p>
              <button
                type="button"
                className="btn-secondary whitespace-nowrap inline-flex items-center gap-2"
                onClick={() => copyToClipboard(newChildCredentials?.temporaryPassword || '', 'Password')}
              >
                <Copy size={16} />
                Copy
              </button>
            </div>
          </div>
          <div className="pt-2">
            <button className="btn-primary" onClick={handleCloseCredentialsModal}>Done</button>
          </div>
        </div>
      </Modal>

      <CreateAssignmentModal
        isOpen={showNewAssignmentModal}
        onClose={() => setShowNewAssignmentModal(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};

export default ParentDashboard;

