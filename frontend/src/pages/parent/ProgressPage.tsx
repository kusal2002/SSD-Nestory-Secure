import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import AssignmentProgressBoard from '../../components/progress/AssignmentProgressBoard';
import AssignmentService from '../../services/assignmentService';
import FamilyService from '../../services/familyService';
import ReadingService from '../../services/readingService';
import ReadingWeeklyBarChart from '../../components/progress/ReadingWeeklyBarChart';
import { AssignmentProgressOverview, Family, ReadingActivitySummary } from '../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, BarChart3 } from 'lucide-react';

const ParentProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [family, setFamily] = useState<Family | null>(null);
  const [data, setData] = useState<AssignmentProgressOverview | null>(null);
  const [weekActivity, setWeekActivity] = useState<ReadingActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterChildId, setFilterChildId] = useState(() => searchParams.get('childId') ?? '');

  useEffect(() => {
    const cid = searchParams.get('childId') ?? '';
    setFilterChildId((prev) => (prev === cid ? prev : cid));
  }, [searchParams]);

  useEffect(() => {
    FamilyService.getMyFamily()
      .then(setFamily)
      .catch(() => {
        /* optional — filter still works from assignment rows */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [overview, activity] = await Promise.all([
          AssignmentService.getParentProgressOverview(filterChildId || undefined),
          ReadingService.getFamilyActivitySummary(7).catch(() => null),
        ]);
        if (!cancelled) {
          setData(overview);
          setWeekActivity(activity);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const message =
            typeof e === 'object' &&
            e !== null &&
            'response' in e &&
            typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message ===
              'string'
              ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
              : 'Failed to load progress';
          toast.error(message || 'Failed to load progress');
          setData(null);
          setWeekActivity(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [filterChildId]);

  const childOptions = useMemo(() => {
    const list = family?.children || [];
    return list
      .map((c) => ({ id: String(c.id || c._id || ''), name: c.name }))
      .filter((c) => c.id);
  }, [family]);

  const handleFilterChildId = (id: string) => {
    setFilterChildId(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set('childId', id);
        else next.delete('childId');
        return next;
      },
      { replace: true }
    );
  };

  const printTitle =
    filterChildId && childOptions.length > 0
      ? `Reading progress — ${childOptions.find((c) => c.id === filterChildId)?.name || 'filtered'}`
      : 'Reading progress — family';

  return (
    <div className="flex-1 overflow-auto">
      <div className="no-print">
        <Navbar title="Reading Progress" />
      </div>

      <div className="container-responsive py-8 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nestory-500 to-nestory-700 flex items-center justify-center shadow-lg shadow-nestory-100 shrink-0">
              <BarChart3 className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight lg:text-5xl mb-2">Reading Progress</h1>
              <p className="text-gray-600 text-lg max-w-2xl">
                See each child’s assignment progress, how finished dates compare to due dates, and what pace
                is needed to hit deadlines.
              </p>
            </div>
          </div>
        </div>

        {weekActivity && (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 p-10 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Family Activity</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Weekly <span className="text-indigo-600">Insights</span></h2>
              <p className="text-gray-500 font-bold text-sm mt-2 uppercase tracking-widest leading-relaxed">
                Combined reading metrics for all children (Last {weekActivity.days} days)
              </p>
              
              <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg group">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Total Pages</p>
                  <p className="text-4xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tighter">{weekActivity.totalPagesLogged}</p>
                </div>
                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg group">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Total Minutes</p>
                  <p className="text-4xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tighter">{weekActivity.totalMinutesLogged}</p>
                </div>
                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg group">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Progress Saves</p>
                  <p className="text-4xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tighter">{weekActivity.progressSaveCount}</p>
                </div>
                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg group text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Period</p>
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                    {new Date(weekActivity.periodStart).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(weekActivity.periodEnd).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col bg-gray-50/30 rounded-[2.5rem] p-10 border border-gray-100 shadow-inner group" style={{ height: "450px" }}>
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                   <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">Minutes per day</span>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reading Time</span>
                      </div>
                   </div>
                </div>
                <div className="flex-1 min-h-0 w-full">
                  <ReadingWeeklyBarChart
                    byDay={weekActivity?.byDay || []}
                    isParent={true}
                    title="Family Reading Activity"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <AssignmentProgressBoard
          data={data}
          loading={loading}
          showChildColumn
          filterChildId={filterChildId}
          onFilterChildId={handleFilterChildId}
          childOptions={childOptions}
          enableExportPrint
          documentTitle={printTitle}
          enableAssignmentSearch
        />
      </div>
    </div>
  );
};

export default ParentProgressPage;
