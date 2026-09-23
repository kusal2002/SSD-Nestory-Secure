import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import gService from '../../../services/gamificationService';

const AnalyticsAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [levelDistribution, setLevelDistribution] = useState<any[]>([]);
  const [xpTimeline, setXpTimeline] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, distData, timelineData] = await Promise.all([
        gService.getSystemStats(),
        gService.getLevelDistribution(),
        gService.getXpTimeline()
      ]);
      setSystemStats(statsData);
      setLevelDistribution(distData);
      setXpTimeline(timelineData);
    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-black text-gray-900 tracking-tight'>ANALYTICS & <span className='text-nestory-600'>PROGRESS</span></h1>
          <p className='text-gray-500 font-bold text-xs uppercase tracking-widest mt-1'>Monitor player progression, levels, and earning trends</p>
        </div>
        <div className='flex gap-3'>
          <button 
            onClick={loadData}
            className='p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all text-gray-600 shadow-sm'
            title="Refresh Data"
          >
            <TrendingUp size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <div className='bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300'>
          <div className='flex items-center justify-between mb-4'>
            <div className='p-3 bg-blue-50 rounded-2xl'>
              <Users className='text-blue-500' size={20} />
            </div>
            <span className='text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase tracking-tighter'>System</span>
          </div>
          <h3 className='text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1'>Total Players</h3>
          <p className='text-3xl font-black text-gray-900 tracking-tighter'>{systemStats?.totalPlayers ?? 0}</p>
        </div>

        <div className='bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300'>
          <div className='flex items-center justify-between mb-4'>
            <div className='p-3 bg-green-50 rounded-2xl'>
              <TrendingUp className='text-green-500' size={20} />
            </div>
            <span className='text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase tracking-tighter'>Average</span>
          </div>
          <h3 className='text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1'>Avg Player Level</h3>
          <p className='text-3xl font-black text-gray-900 tracking-tighter'>{systemStats?.avgLevel ?? 0}</p>
        </div>

        <div className='bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300'>
          <div className='flex items-center justify-between mb-4'>
            <div className='p-3 bg-yellow-50 rounded-2xl'>
              <Zap className='text-yellow-500' size={20} />
            </div>
            <span className='text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase tracking-tighter'>Total</span>
          </div>
          <h3 className='text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1'>Total XP Awarded</h3>
          <p className='text-3xl font-black text-gray-900 tracking-tighter'>{systemStats?.totalXpAwarded ?? 0}</p>
        </div>
      </div>

      <div className='bg-white rounded-[2.5rem] border border-orange-100 shadow-sm overflow-hidden'>
        <div className='p-8'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-32 space-y-4'>
              <Loader2 size={48} className='text-nestory-500 animate-spin' />
              <p className='text-gray-400 font-black text-xs uppercase tracking-widest animate-pulse'>Loading analytics...</p>
            </div>
          ) : (
            <div className='space-y-8'>
              {/* Level Distribution Chart */}
              <div>
                <h3 className='font-black text-gray-900 mb-6 text-lg uppercase'>Player Level Distribution</h3>
                <div className='space-y-4'>
                  {levelDistribution.length > 0 ? (
                    levelDistribution.slice(0, 15).map((item: any) => {
                      const maxPlayers = Math.max(...levelDistribution.map((d: any) => d.players));
                      const percentage = (item.players / maxPlayers) * 100;
                      return (
                        <div key={item.level} className='space-y-1'>
                          <div className='flex justify-between items-center'>
                            <span className='text-sm font-bold text-gray-700'>Level {item.level}</span>
                            <span className='text-xs font-black text-gray-500 bg-gray-50 px-3 py-1 rounded-full'>{item.players} players</span>
                          </div>
                          <div className='h-3 bg-gray-100 rounded-full overflow-hidden'>
                            <div 
                              className='h-full bg-gradient-to-r from-nestory-400 to-nestory-600 rounded-full transition-all'
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className='text-gray-400 text-center py-8'>No data available</p>
                  )}
                </div>
              </div>

              {/* XP Timeline Chart */}
              <div className='border-t border-orange-100 pt-8'>
                <h3 className='font-black text-gray-900 mb-6 text-lg uppercase'>XP Awarded (Last 30 Days)</h3>
                <div className='space-y-4 max-h-96 overflow-y-auto'>
                  {xpTimeline.length > 0 ? (
                    xpTimeline.map((item: any) => {
                      const maxPoints = Math.max(...xpTimeline.map((t: any) => t.points));
                      const percentage = maxPoints > 0 ? (item.points / maxPoints) * 100 : 0;
                      return (
                        <div key={item.date} className='space-y-1'>
                          <div className='flex justify-between items-center'>
                            <span className='text-sm font-bold text-gray-700'>{item.date}</span>
                            <span className='text-xs font-black text-gray-500 bg-yellow-50 px-3 py-1 rounded-full'>{item.points} XP</span>
                          </div>
                          <div className='h-3 bg-gray-100 rounded-full overflow-hidden'>
                            <div 
                              className='h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all'
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className='text-gray-400 text-center py-8'>No data available</p>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className='bg-blue-50 rounded-[2.5rem] p-8 border-2 border-blue-200'>
                <h4 className='font-black text-gray-900 mb-3 text-lg uppercase'>Progress System Status</h4>
                <p className='text-sm text-gray-700 leading-relaxed mb-4'>
                  ✓ Leveling engine operational<br/>
                  ✓ Point calculations automatic<br/>
                  ✓ Achievement tracking enabled<br/>
                  ✓ Leaderboard updates live
                </p>
                <p className='text-xs text-gray-500 font-bold uppercase tracking-widest'>To view individual player progress, navigate to Users page or parent dashboard.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAdminPage;
