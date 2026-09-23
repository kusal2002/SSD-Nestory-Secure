import React, { useMemo, useState } from 'react';
import {
  AssignmentProgressOverview,
  AssignmentProgressRow,
} from '../../types';
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  Search,
  Target,
  TrendingUp,
} from 'lucide-react';

const csvEscape = (value: string | number | null | undefined) => {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadProgressCsv = (data: AssignmentProgressOverview, filenameBase: string) => {
  const headers = [
    'Child',
    'Story',
    'Status',
    'Due date',
    'Completed',
    'Pages read',
    'Total pages',
    'Progress %',
    'Minutes logged',
  ];
  const rows = data.assignments.map((row) =>
    [
      row.childName,
      row.storyTitle,
      row.status,
      row.dueDate || '',
      row.completedAt || '',
      row.reading.pagesRead,
      row.reading.totalPages,
      row.reading.progressPercent,
      row.reading.timeSpentMinutes,
    ].map(csvEscape)
  );
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe = filenameBase.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_|_$/g, '') || 'nestory_progress';
  a.href = url;
  a.download = `${safe}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

const statusLabel = (s: string) => s.replace('_', ' ');

const RowCard: React.FC<{
  row: AssignmentProgressRow;
  showChild: boolean;
}> = ({ row, showChild }) => {
  const { reading, pace, deadlinePace, deadlineVsCompletion } = row;
  const active = row.status !== 'completed';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {showChild && (
            <p className="text-xs font-semibold uppercase tracking-wide text-nestory-600 mb-0.5">
              {row.childName}
            </p>
          )}
          <h3 className="text-lg font-bold text-gray-900">{row.storyTitle}</h3>
          <p className="text-sm text-gray-600 capitalize">{statusLabel(row.status)}</p>
        </div>
        {deadlineVsCompletion && row.status === 'completed' && (
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium shrink-0 px-2.5 py-1 rounded-lg ${
              deadlineVsCompletion.outcome === 'late'
                ? 'bg-red-50 text-red-800'
                : deadlineVsCompletion.outcome === 'early'
                  ? 'bg-green-50 text-green-800'
                  : deadlineVsCompletion.outcome === 'on_time'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-gray-100 text-gray-700'
            }`}
          >
            <CheckCircle2 size={16} />
            {deadlineVsCompletion.label}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-gray-500 text-xs mb-1">Progress</p>
          <p className="font-bold text-gray-900">{reading.progressPercent}%</p>
          <p className="text-xs text-gray-600">
            {reading.pagesRead} / {reading.totalPages} pages
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-gray-500 text-xs mb-1">Reading time logged</p>
          <p className="font-bold text-gray-900">{reading.timeSpentMinutes} min</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-gray-500 text-xs mb-1">Due date</p>
          <p className="font-bold text-gray-900">{formatDate(row.dueDate)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-gray-500 text-xs mb-1">Completed</p>
          <p className="font-bold text-gray-900">{formatDate(row.completedAt)}</p>
        </div>
      </div>

      {active && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-nestory-600" />
            Pace and deadline
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-nestory-100 bg-nestory-50/50 p-3">
              <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <CalendarClock size={14} />
                Based on how you have been reading
              </p>
              <ul className="space-y-1 text-gray-800">
                <li>
                  <span className="text-gray-600">Avg pages / day: </span>
                  <strong>{reading.pagesRead > 0 ? pace.pagesPerDayActual : '—'}</strong>
                </li>
                <li>
                  <span className="text-gray-600">Projected finish: </span>
                  <strong>{formatDate(pace.projectedCompletionDate)}</strong>
                </li>
                {pace.avgMinutesPerPage != null && (
                  <li>
                    <span className="text-gray-600">Avg min / page: </span>
                    <strong>{pace.avgMinutesPerPage}</strong>
                  </li>
                )}
              </ul>
              {deadlinePace.hasDeadline && pace.projectedCompletionDate && deadlinePace.onTrack !== null && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    deadlinePace.onTrack ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {deadlinePace.onTrack
                    ? 'At this pace you are on track to finish by the due date.'
                    : 'At this pace you may finish after the due date — see targets below.'}
                </p>
              )}
            </div>

            {deadlinePace.hasDeadline && reading.pagesRemaining > 0 && (
              <div
                className={`rounded-lg border p-3 ${
                  deadlinePace.isOverdue
                    ? 'border-red-200 bg-red-50/60'
                    : 'border-amber-100 bg-amber-50/40'
                }`}
              >
                <p className="text-xs text-gray-700 mb-2 flex items-center gap-1 font-medium">
                  <Target size={14} />
                  To meet the deadline
                  {deadlinePace.isOverdue && (
                    <span className="inline-flex items-center gap-1 text-red-700 ml-1">
                      <AlertTriangle size={14} />
                      Overdue
                    </span>
                  )}
                </p>
                <ul className="space-y-1 text-gray-800">
                  <li>
                    <span className="text-gray-600">Days left (by calendar): </span>
                    <strong>
                      {deadlinePace.daysUntilDue == null
                        ? '—'
                        : deadlinePace.daysUntilDue < 0
                          ? `${Math.abs(deadlinePace.daysUntilDue)} past due`
                          : deadlinePace.daysUntilDue}
                    </strong>
                  </li>
                  <li>
                    <span className="text-gray-600">Pages remaining: </span>
                    <strong>{reading.pagesRemaining}</strong>
                  </li>
                  <li>
                    <span className="text-gray-600">Target pages / day: </span>
                    <strong>
                      {deadlinePace.pagesPerDayNeeded != null ? deadlinePace.pagesPerDayNeeded : '—'}
                    </strong>
                  </li>
                  {deadlinePace.minutesPerDayNeeded != null && (
                    <li className="flex items-start gap-1">
                      <Clock size={14} className="shrink-0 mt-0.5 text-gray-500" />
                      <span>
                        <span className="text-gray-600">Est. reading / day (from your pace): </span>
                        <strong>{deadlinePace.minutesPerDayNeeded} min</strong>
                      </span>
                    </li>
                  )}
                </ul>
                {reading.pagesRead === 0 && (
                  <p className="mt-2 text-xs text-gray-600">
                    Start reading and logging pages — we will refine these estimates as you go.
                  </p>
                )}
              </div>
            )}

            {!deadlinePace.hasDeadline && (
              <div className="rounded-lg border border-dashed border-gray-200 p-3 text-sm text-gray-600 md:col-span-2">
                No due date on this assignment. Ask a parent to add one when they assign the next book
                if you want deadline targets here.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface AssignmentProgressBoardProps {
  data: AssignmentProgressOverview | null;
  loading: boolean;
  showChildColumn: boolean;
  filterChildId: string;
  onFilterChildId: (id: string) => void;
  childOptions: { id: string; name: string }[];
  enableExportPrint?: boolean;
  documentTitle?: string;
  /** Search box to filter assignment cards by title, status, dates, and child name (parent view). */
  enableAssignmentSearch?: boolean;
}

const rowMatchesQuery = (row: AssignmentProgressRow, showChild: boolean, q: string) => {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  const parts = [
    row.storyTitle,
    row.status,
    statusLabel(row.status),
    formatDate(row.dueDate),
    formatDate(row.completedAt),
    String(row.reading.progressPercent),
    `${row.reading.pagesRead}/${row.reading.totalPages}`,
  ];
  if (showChild) parts.push(row.childName);
  return parts.some((p) => p.toLowerCase().includes(n));
};

const AssignmentProgressBoard: React.FC<AssignmentProgressBoardProps> = ({
  data,
  loading,
  showChildColumn,
  filterChildId,
  onFilterChildId,
  childOptions,
  enableExportPrint = false,
  documentTitle = 'Nestory reading progress',
  enableAssignmentSearch = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssignments = useMemo(() => {
    if (!data) return [];
    if (!enableAssignmentSearch) return data.assignments;
    return data.assignments.filter((row) => rowMatchesQuery(row, showChildColumn, searchQuery));
  }, [data, enableAssignmentSearch, showChildColumn, searchQuery]);

  const dataForExport = useMemo(() => {
    if (!data) return data;
    if (enableAssignmentSearch && searchQuery.trim()) {
      return { ...data, assignments: filteredAssignments };
    }
    return data;
  }, [data, enableAssignmentSearch, searchQuery, filteredAssignments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-600">
        <div className="w-12 h-12 border-4 border-nestory-200 border-t-nestory-600 rounded-full animate-spin mb-4" />
        Loading progress…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card text-center py-12 text-gray-600">
        Could not load progress. Try again later.
      </div>
    );
  }

  const { summary, assignments } = data;
  const generatedLabel = Number.isNaN(new Date(data.generatedAt).getTime())
    ? '—'
    : new Date(data.generatedAt).toLocaleString();

  return (
    <div className="space-y-8">
      <div className="hidden print:block print:mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{documentTitle}</h1>
        <p className="text-sm text-gray-600 mt-1">Generated {generatedLabel}</p>
      </div>

      {enableExportPrint && (
        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            type="button"
            onClick={() => downloadProgressCsv(dataForExport, documentTitle)}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card text-center py-3">
          <p className="text-xs text-gray-500">Active + deadline</p>
          <p className="text-2xl font-bold text-gray-900">{summary.activeWithDeadline}</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xs text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{summary.overdueCount}</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xs text-gray-500">On-time done</p>
          <p className="text-2xl font-bold text-emerald-700">{summary.completedOnTime}</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xs text-gray-500">Early</p>
          <p className="text-2xl font-bold text-green-700">{summary.completedEarly}</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xs text-gray-500">Late</p>
          <p className="text-2xl font-bold text-red-700">{summary.completedLate}</p>
        </div>
      </div>

      {showChildColumn && childOptions.length > 0 && (
        <div className="no-print flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by child</label>
          <select
            value={filterChildId}
            onChange={(e) => onFilterChildId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">All children</option>
            {childOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {enableAssignmentSearch && assignments.length > 0 && (
        <div className="no-print card py-3 px-4">
          <label htmlFor="assignment-progress-search" className="sr-only">
            Search assignments
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={18}
              aria-hidden
            />
            <input
              id="assignment-progress-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by book title, status, or date…"
              className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-nestory-500 focus:border-nestory-500 outline-none"
              autoComplete="off"
            />
          </div>
          {searchQuery.trim() ? (
            <p className="text-xs text-gray-500 mt-2">
              Showing {filteredAssignments.length} of {assignments.length} assignment
              {assignments.length === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      )}

      <p className="text-xs text-gray-500 flex items-center gap-1 print:text-gray-700">
        <BookOpen size={14} />
        Updated {generatedLabel} — reading stats come from logged sessions for each book.
      </p>

      {assignments.length === 0 ? (
        <div className="card text-center py-12 text-gray-600">No assignments yet.</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="card text-center py-12 text-gray-600">
          No assignments match your search. Try a different title, status, or date.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((row) => (
            <RowCard key={row.assignmentId} row={row} showChild={showChildColumn} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentProgressBoard;
