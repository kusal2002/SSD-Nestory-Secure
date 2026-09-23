import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import SelectField from '../../components/common/SelectField';
import InputField from '../../components/common/InputField';
import { ArrowRight, BarChart3, Library, RotateCcw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AssignmentService from '../../services/assignmentService';
import ChildService from '../../services/childService';
import StoryService from '../../services/storyService';
import { useAssignmentDetail } from '../../contexts/AssignmentDetailContext';
import {
  Assignment,
  AssignmentDueState,
  AssignmentPagination,
  AssignmentProgressRow,
  AssignmentStatus,
  Child,
  Story,
} from '../../types';

const DEFAULT_PAGINATION: AssignmentPagination = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

type ErrorWithResponse = {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const normalized = error as ErrorWithResponse;
  return normalized?.response?.data?.message || normalized?.message || fallback;
};

const isDuplicateAssignmentError = (message: string): boolean => {
  return /already assigned/i.test(message);
};

const formatDueDate = (dueDate?: string): string => {
  if (!dueDate) return 'No due date';
  return new Date(dueDate).toLocaleDateString();
};

const isOverdueAssignment = (assignment: Assignment): boolean => {
  if (typeof assignment.isOverdue === 'boolean') {
    return assignment.isOverdue;
  }
  if (!assignment.dueDate || assignment.status === 'completed') return false;
  return new Date(assignment.dueDate).getTime() < Date.now();
};

const getDueTone = (assignment: Assignment): { label: string; classes: string } | null => {
  if (!assignment.dueDate) return null;

  if (isOverdueAssignment(assignment)) {
    return { label: 'Overdue', classes: 'badge bg-red-100 text-red-700' };
  }

  if (assignment.isDueSoon || assignment.dueState === 'due_soon') {
    return { label: 'Due Soon', classes: 'badge bg-amber-100 text-amber-700' };
  }

  return { label: 'Upcoming', classes: 'badge bg-blue-100 text-blue-700' };
};

const formatMediumDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

const AssignmentRowProgressHint: React.FC<{
  assignment: Assignment;
  row?: AssignmentProgressRow;
}> = ({ assignment, row }) => {
  if (!row) return null;

  if (assignment.status === 'completed') {
    const d = row.deadlineVsCompletion;
    if (!d || d.outcome === 'incomplete') return null;
    return (
      <div className="mt-2 text-xs text-gray-600 flex flex-wrap items-center gap-2">
        <span className="font-medium text-gray-800">Deadline vs completed:</span>
        <span>{d.label}</span>
      </div>
    );
  }

  const hasDue = !!assignment.dueDate;
  const hasProjected = !!row.pace.projectedCompletionDate && row.reading.pagesRead > 0;

  if (!hasDue && !hasProjected) return null;

  return (
    <div className="mt-2 rounded-md bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-700 space-y-1">
      <p className="font-semibold text-gray-800 flex items-center gap-1">
        <BarChart3 size={12} className="text-nestory-600 shrink-0" />
        Reading pace (from logged sessions)
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {hasProjected && (
          <span>
            Projected finish:{' '}
            <strong>{formatMediumDate(row.pace.projectedCompletionDate!)}</strong>
          </span>
        )}
        {hasDue && (
          <span>
            Due date: <strong>{formatDueDate(assignment.dueDate)}</strong>
          </span>
        )}
      </div>
      {hasDue && row.deadlinePace.onTrack === true && (
        <p className="text-green-700 font-medium">On track to finish by the due date.</p>
      )}
      {hasDue && row.deadlinePace.onTrack === false && (
        <p className="text-amber-800 font-medium">At current pace, may finish after the due date.</p>
      )}
      {hasDue && row.reading.pagesRemaining > 0 && row.deadlinePace.pagesPerDayNeeded != null && (
        <p className="text-gray-600">
          ~<strong>{row.deadlinePace.pagesPerDayNeeded}</strong> pages/day to meet deadline
          {row.deadlinePace.minutesPerDayNeeded != null && (
            <>
              {' '}
              (~<strong>{row.deadlinePace.minutesPerDayNeeded}</strong> min/day est.)
            </>
          )}
        </p>
      )}
      {row.reading.pagesRead === 0 && hasDue && (
        <p className="text-gray-500">No pages logged yet — see full progress for pace targets.</p>
      )}
    </div>
  );
};

const AssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [duplicateFeedback, setDuplicateFeedback] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AssignmentStatus>('all');
  const [dueStateFilter, setDueStateFilter] = useState<AssignmentDueState>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueDate' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(8);
  const [pagination, setPagination] = useState<AssignmentPagination>(DEFAULT_PAGINATION);
  const [listMetadata, setListMetadata] = useState({ overdueCount: 0, dueSoonCount: 0 });
  const [progressByAssignmentId, setProgressByAssignmentId] = useState<
    Record<string, AssignmentProgressRow>
  >({});
  const [detailDueDateDraft, setDetailDueDateDraft] = useState('');
  const [detailStatusDraft, setDetailStatusDraft] = useState<AssignmentStatus>('assigned');
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState('');

  const {
    selectedAssignmentId,
    assignmentDetail,
    isLoadingDetail,
    detailError,
    selectAssignment,
    clearSelection,
    refreshSelectedAssignment,
  } = useAssignmentDetail();

  const [formData, setFormData] = useState({
    childId: '',
    storyId: '',
    dueDate: '',
    notes: '',
  });

  const childOptions = useMemo(
    () => [
      { value: '', label: 'Select Child' },
      ...children.map((child) => ({ value: child.id, label: `${child.name} (Age ${child.age})` })),
    ],
    [children]
  );

  const storyOptions = useMemo(
    () => [
      { value: '', label: 'Select Story' },
      ...stories.map((story) => ({ value: story.id, label: `${story.title} — ${story.author}` })),
    ],
    [stories]
  );

  const statusOptions = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const dueStateOptions: Array<{ value: AssignmentDueState; label: string }> = [
    { value: 'all', label: 'All due states' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'due_soon', label: 'Due soon' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'none', label: 'No due date' },
  ];

  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return assignments;

    return assignments.filter((assignment) => {
      const storyTitle = assignment.story?.title || '';
      const storyAuthor = assignment.story?.author || '';
      const notes = assignment.notes || '';
      return [storyTitle, storyAuthor, notes].some((value) => value.toLowerCase().includes(query));
    });
  }, [assignments, searchTerm]);

  const selectedAssignmentPreview = useMemo(() => {
    return assignments.find((item) => item.id === selectedAssignmentId) || null;
  }, [assignments, selectedAssignmentId]);

  const statusCounts = useMemo(() => {
    const base = { assigned: 0, inProgress: 0, completed: 0 };
    for (const assignment of assignments) {
      if (assignment.status === 'assigned') base.assigned += 1;
      if (assignment.status === 'in_progress') base.inProgress += 1;
      if (assignment.status === 'completed') base.completed += 1;
    }
    return base;
  }, [assignments]);

  const detailToRender = assignmentDetail || selectedAssignmentPreview;

  useEffect(() => {
    const dueValue = detailToRender?.dueDate ? new Date(detailToRender.dueDate).toISOString().slice(0, 10) : '';
    setDetailDueDateDraft(dueValue);
    setDetailStatusDraft(detailToRender?.status || 'assigned');
  }, [detailToRender?.id, detailToRender?.dueDate, detailToRender?.status]);

  const loadBaseData = async () => {
    try {
      setIsLoading(true);
      const [childrenData, storyResponse] = await Promise.all([
        ChildService.getChildren(),
        StoryService.getStories(1, 100),
      ]);

      const normalizedChildren = childrenData;

      const normalizedStories = (storyResponse.stories || []).map((story) => ({
        ...story,
        id: story.id || story._id || '',
      }));

      setChildren(normalizedChildren);
      setStories(normalizedStories);

      if (normalizedChildren.length > 0) {
        const firstChildId = normalizedChildren[0].id;
        setSelectedChildId(firstChildId);
        setFormData((prev) => ({ ...prev, childId: firstChildId }));
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load assignment setup data'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = useCallback(
    async (childId: string, targetPage = currentPage) => {
      if (!childId) {
        setAssignments([]);
        setProgressByAssignmentId({});
        setPagination(DEFAULT_PAGINATION);
        setListMetadata({ overdueCount: 0, dueSoonCount: 0 });
        clearSelection();
        return;
      }

      try {
        setIsListLoading(true);

        const response = await AssignmentService.listAssignments({
          childId,
          status: statusFilter === 'all' ? undefined : statusFilter,
          dueState: dueStateFilter,
          page: targetPage,
          limit: pageLimit,
          sortBy,
          sortOrder,
        });

        setAssignments(response.data);
        setPagination(response.pagination);
        setListMetadata(response.metadata);

        try {
          const overview = await AssignmentService.getParentProgressOverview(childId);
          const map: Record<string, AssignmentProgressRow> = {};
          overview.assignments.forEach((r) => {
            map[r.assignmentId] = r;
          });
          setProgressByAssignmentId(map);
        } catch {
          setProgressByAssignmentId({});
        }

        if (selectedAssignmentId && !response.data.some((item) => item.id === selectedAssignmentId)) {
          clearSelection();
          setExpandedAssignmentId('');
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'Failed to load assignments'));
      } finally {
        setIsListLoading(false);
      }
    },
    [
      clearSelection,
      currentPage,
      dueStateFilter,
      pageLimit,
      selectedAssignmentId,
      sortBy,
      sortOrder,
      statusFilter,
    ]
  );

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadAssignments(selectedChildId, currentPage);
  }, [currentPage, loadAssignments, selectedChildId]);

  const handleCreate = async () => {
    if (!formData.childId || !formData.storyId) {
      toast.error('Please select both child and story');
      return;
    }

    try {
      setIsSaving(true);
      setDuplicateFeedback('');
      await AssignmentService.createAssignment({
        childId: formData.childId,
        storyId: formData.storyId,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Assignment created');
      setFormData((prev) => ({ ...prev, storyId: '', dueDate: '', notes: '' }));
      setCurrentPage(1);
      await loadAssignments(formData.childId, 1);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Failed to create assignment');
      if (isDuplicateAssignmentError(message)) {
        setDuplicateFeedback('This story is already assigned to this child. Pick a different story or child.');
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm('Delete this assignment?')) return;

    const previousAssignments = assignments;
    setDeletingIds((prev) => [...prev, assignmentId]);
    setAssignments((prev) => prev.filter((item) => item.id !== assignmentId));
    setPagination((prev) => {
      const nextTotal = Math.max(prev.totalItems - 1, 0);
      const nextTotalPages = Math.max(Math.ceil(nextTotal / prev.limit), 1);
      return {
        ...prev,
        totalItems: nextTotal,
        totalPages: nextTotalPages,
        hasNextPage: prev.page < nextTotalPages,
        hasPrevPage: prev.page > 1,
      };
    });

    if (selectedAssignmentId === assignmentId) {
      clearSelection();
    }

    try {
      await AssignmentService.deleteAssignment(assignmentId);
      toast.success('Assignment deleted');

      const nextPage = assignments.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        await loadAssignments(selectedChildId, nextPage);
      }
    } catch (error: unknown) {
      setAssignments(previousAssignments);
      toast.error(getErrorMessage(error, 'Failed to delete assignment'));
    } finally {
      setDeletingIds((prev) => prev.filter((item) => item !== assignmentId));
    }
  };

  const handleSaveDetailDueDate = async () => {
    if (!selectedAssignmentId) {
      toast.error('Select an assignment first');
      return;
    }

    try {
      setIsSavingDetail(true);
      await AssignmentService.updateAssignmentDetails(selectedAssignmentId, {
        dueDate: detailDueDateDraft || undefined,
      });

      await loadAssignments(selectedChildId, currentPage);
      await refreshSelectedAssignment();
      toast.success('Due date updated');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update due date'));
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleSaveDetailStatus = async () => {
    if (!selectedAssignmentId) {
      toast.error('Select an assignment first');
      return;
    }

    try {
      setIsSavingDetail(true);
      await AssignmentService.updateAssignmentStatus(selectedAssignmentId, detailStatusDraft);
      await loadAssignments(selectedChildId, currentPage);
      await refreshSelectedAssignment();
      toast.success('Status updated');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update status'));
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleToggleDetails = (assignmentId: string) => {
    if (expandedAssignmentId === assignmentId) {
      setExpandedAssignmentId('');
      return;
    }

    setExpandedAssignmentId(assignmentId);
    void selectAssignment(assignmentId);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDueStateFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== 'all' ||
    dueStateFilter !== 'all' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <Navbar title="Assignments" />
        <div className="container-responsive py-10 text-center">
          <div className="w-16 h-16 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <Navbar title="Assignments" />
      <div className="container-responsive py-8 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight lg:text-5xl mb-2">Manage Assignments</h1>
            <p className="text-gray-600 text-lg">Create, search, filter, and manage child assignments with live updates.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              type="button"
              className="btn-secondary flex items-center justify-center gap-2"
              onClick={() => navigate('/stories')}
            >
              <Library size={16} />
              View Library
            </button>
            <button
              type="button"
              className="btn-primary flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              onClick={() =>
                navigate(
                  selectedChildId
                    ? `/progress?childId=${encodeURIComponent(selectedChildId)}`
                    : '/progress'
                )
              }
            >
              <BarChart3 size={16} />
              Reading Progress
            </button>
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Create Assignment</h2>
          <p className="text-sm text-gray-600 mb-4">Assign a story quickly, then track and update progress from one place.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <SelectField
              label="Child"
              name="childId"
              value={formData.childId}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, childId: e.target.value }));
                setSelectedChildId(e.target.value);
              }}
              options={childOptions}
            />
            <SelectField
              label="Story"
              name="storyId"
              value={formData.storyId}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, storyId: e.target.value }));
                if (duplicateFeedback) {
                  setDuplicateFeedback('');
                }
              }}
              options={storyOptions}
            />
            <InputField
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              className="input-base min-h-24"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional assignment notes"
            />
          </div>
          <button onClick={handleCreate} disabled={isSaving} className="btn-primary">
            {isSaving ? 'Saving...' : 'Create Assignment'}
          </button>
          {duplicateFeedback && (
            <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
              {duplicateFeedback}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Assigned</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{statusCounts.assigned}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">In Progress</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">{statusCounts.inProgress}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Completed</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{statusCounts.completed}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Visible Results</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{filteredAssignments.length}</p>
          </div>
        </div>

        <div className="card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900">Assignments</h2>
              <div className="w-full lg:w-64">
                <SelectField
                  name="selectedChild"
                  value={selectedChildId}
                  onChange={(e) => {
                    setSelectedChildId(e.target.value);
                    setFormData((prev) => ({ ...prev, childId: e.target.value }));
                    setCurrentPage(1);
                  }}
                  options={childOptions}
                />
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-nestory-200 bg-nestory-50/60 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-sm text-nestory-900 flex items-center gap-2">
                <Sparkles size={16} className="text-nestory-700 shrink-0" />
                Focused on{' '}
                <span className="font-semibold">
                  {children.find((child) => child.id === selectedChildId)?.name || 'selected child'}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
                <button
                  type="button"
                  className="text-nestory-700 hover:text-nestory-800"
                  onClick={() => navigate('/dashboard')}
                >
                  Child dashboards
                </button>
                <button
                  type="button"
                  className="text-nestory-700 hover:text-nestory-800 inline-flex items-center gap-1"
                  onClick={() =>
                    navigate(
                      selectedChildId
                        ? `/progress?childId=${encodeURIComponent(selectedChildId)}`
                        : '/progress'
                    )
                  }
                >
                  <BarChart3 size={14} />
                  Full reading progress
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
              <div className="xl:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Search</label>
                <input
                  className="input-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, author, or notes"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select
                  className="input-base"
                  value={statusFilter}
                  title="Filter assignments by status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'all' | AssignmentStatus);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Due State</label>
                <SelectField
                  name="dueState"
                  value={dueStateFilter}
                  onChange={(e) => {
                    setDueStateFilter(e.target.value as AssignmentDueState);
                    setCurrentPage(1);
                  }}
                  options={dueStateOptions}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Page Size</label>
                <select
                  className="input-base"
                  value={pageLimit}
                  title="Assignments per page"
                  onChange={(e) => {
                    setPageLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-red-600">{listMetadata.overdueCount}</span> overdue
                <span className="mx-2">•</span>
                <span className="font-semibold text-amber-600">{listMetadata.dueSoonCount}</span> due soon
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="input-base w-36"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as 'createdAt' | 'dueDate' | 'status');
                    setCurrentPage(1);
                  }}
                  title="Sort by"
                >
                  <option value="createdAt">Sort: Created</option>
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="status">Sort: Status</option>
                </select>
                <select
                  className="input-base w-28"
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as 'asc' | 'desc');
                    setCurrentPage(1);
                  }}
                  title="Sort order"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            {isListLoading ? (
              <p className="text-gray-600">Loading assignment list...</p>
            ) : filteredAssignments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                <p className="text-gray-700 font-semibold mb-1">No assignments match your current filters.</p>
                <p className="text-sm text-gray-600 mb-4">Try resetting filters or create a new assignment for this child.</p>
                <button className="btn-secondary" onClick={handleResetFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => {
                  const dueTone = getDueTone(assignment);
                  const isDeleting = deletingIds.includes(assignment.id);
                  const isExpanded = expandedAssignmentId === assignment.id;
                  return (
                    <div
                      key={assignment.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        isExpanded
                          ? 'border-nestory-400 bg-nestory-50/40'
                          : 'border-gray-200 bg-white'
                      } ${isOverdueAssignment(assignment) ? 'ring-1 ring-red-200' : ''}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{assignment.story?.title || 'Untitled story'}</p>
                          <p className="text-sm text-gray-600">{assignment.story?.author || 'Unknown'}</p>
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            {assignment.story?.readingLevel && (
                              <span className="badge bg-nestory-100 text-nestory-800 capitalize">
                                {assignment.story.readingLevel}
                              </span>
                            )}
                            {assignment.dueDate && (
                              <span className="badge bg-gray-100 text-gray-700">Due {formatDueDate(assignment.dueDate)}</span>
                            )}
                            {dueTone && <span className={dueTone.classes}>{dueTone.label}</span>}
                          </div>
                          <AssignmentRowProgressHint
                            assignment={assignment}
                            row={progressByAssignmentId[assignment.id]}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="badge bg-gray-100 text-gray-700 capitalize">
                            {assignment.status.replace('_', ' ')}
                          </span>
                          <button
                            className="btn-secondary"
                            disabled={isDeleting}
                            onClick={() => {
                              handleToggleDetails(assignment.id);
                            }}
                          >
                            {isExpanded ? 'Hide Details' : 'Details'}
                          </button>
                          <button className="btn-danger" disabled={isDeleting} onClick={() => handleDelete(assignment.id)}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      {assignment.notes && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{assignment.notes}</p>}

                      <button
                        className="mt-3 text-sm font-semibold text-nestory-700 hover:text-nestory-800 inline-flex items-center gap-1"
                        onClick={() => {
                          handleToggleDetails(assignment.id);
                        }}
                      >
                        {isExpanded ? 'Collapse details' : 'Open assignment details'} <ArrowRight size={14} />
                      </button>

                      <div
                        className={`mt-4 overflow-hidden transition-all duration-300 ease-out ${
                          isExpanded ? 'max-h-[560px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="rounded-lg border border-nestory-200 bg-nestory-50/40 p-4">
                          {selectedAssignmentId !== assignment.id ? null : isLoadingDetail ? (
                            <p className="text-sm text-gray-600">Loading details...</p>
                          ) : detailError ? (
                            <div>
                              <p className="text-sm text-red-600 mb-2">{detailError}</p>
                              <button
                                className="btn-secondary"
                                onClick={() => {
                                  void refreshSelectedAssignment();
                                }}
                              >
                                Retry
                              </button>
                            </div>
                          ) : detailToRender ? (
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-gray-500">Story</p>
                                <p className="font-semibold text-gray-900">{detailToRender.story?.title || 'Untitled story'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Due Date</p>
                                <p className={`font-semibold ${isOverdueAssignment(detailToRender) ? 'text-red-700' : 'text-gray-900'}`}>
                                  {formatDueDate(detailToRender.dueDate)}
                                </p>
                              </div>
                              <div>
                                <label className="block text-gray-500 mb-1">Update Due Date</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="date"
                                    className="input-base"
                                    value={detailDueDateDraft}
                                    onChange={(e) => setDetailDueDateDraft(e.target.value)}
                                    title="Update assignment due date"
                                  />
                                  <button
                                    className="btn-primary"
                                    disabled={isSavingDetail || !selectedAssignmentId}
                                    onClick={handleSaveDetailDueDate}
                                  >
                                    {isSavingDetail ? 'Saving...' : 'Save'}
                                  </button>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500">Status</p>
                                <div className="flex items-center gap-2">
                                  <select
                                    className="input-base"
                                    value={detailStatusDraft}
                                    onChange={(e) => setDetailStatusDraft(e.target.value as AssignmentStatus)}
                                    title="Update assignment status"
                                  >
                                    {statusOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    className="btn-primary"
                                    disabled={isSavingDetail || !selectedAssignmentId || detailStatusDraft === detailToRender.status}
                                    onClick={handleSaveDetailStatus}
                                  >
                                    {isSavingDetail ? 'Saving...' : 'Save Status'}
                                  </button>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500">Notes</p>
                                <p className="text-gray-800 whitespace-pre-wrap">
                                  {detailToRender.notes?.trim() || 'No notes added for this assignment.'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">No details available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages} • {pagination.totalItems} total assignments
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary"
                  disabled={!pagination.hasPrevPage || isListLoading}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <button
                  className="btn-secondary"
                  disabled={!pagination.hasNextPage || isListLoading}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
