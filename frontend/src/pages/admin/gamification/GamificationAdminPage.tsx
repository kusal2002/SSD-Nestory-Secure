import React, { useEffect, useState } from 'react';
import { Award, Star, Search, Plus, Filter, Loader2, Edit2, Trash2, Eye, Settings, RefreshCw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { GamificationBadge, GamificationAchievement } from '../../../types';
import gService from '../../../services/gamificationService';

const GamificationAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'badges' | 'milestones'>('badges');
  const [badges, setBadges] = useState<GamificationBadge[]>([]);
  const [achievements, setAchievements] = useState<GamificationAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'badge' | 'achievement'>('badge');
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    icon: '🏅',
    points: 50,
    category: 'reading',
    tier: 'bronze',
    difficulty: 'easy',
    type: 'one_time',
    threshold: 10,
    criteriaType: 'story_count'
  });

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (createType === 'badge') {
        const payload = {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          category: formData.category || 'achievement',
          tier: formData.tier || 'bronze',
          points: Number(formData.points || 50),
          criteria: {
            type: formData.criteriaType || 'story_count',
            threshold: Number(formData.threshold || 10)
          }
        };
        console.log('Badge Payload:', payload);
        await gService.createBadge(payload);
        toast.success('Badge created successfully');
      } else {
        const payload = {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          category: formData.category || 'milestone',
          type: formData.type || 'one_time',
          targetValue: Number(formData.threshold || 10),
          reward: {
            points: Number(formData.points || 50)
          }
        };
        console.log('Achievement Payload:', payload);
        await gService.createAchievement(payload);
        toast.success('Milestone created successfully');
      }
      setShowCreateModal(false);
      loadData();
    } catch (error: any) {
      console.error('Create error:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Failed to create';
      toast.error(msg);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [badgesData, achievementsData] = await Promise.all([
        gService.getAllBadges(),
        gService.getAllAchievements(),
      ]);
      setBadges(badgesData);
      setAchievements(achievementsData);
    } catch (error: any) {
      console.error('Error loading gamification data:', error);
      toast.error('Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = badges.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAchievements = achievements.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Badges', value: badges.length.toString(), icon: <Award className='text-orange-500' />, change: 'System' },
    { label: 'Active Milestones', value: achievements.length.toString(), icon: <Star className='text-yellow-500' />, change: 'System' },
  ];

  const getTierColor = (tier: string) => {
    switch(tier?.toLowerCase()) {
      case 'gold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'bronze': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'platinum': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-black text-gray-900 tracking-tight'>GAMIFICATION <span className='text-nestory-600'>ENGINE</span></h1>
          <p className='text-gray-500 font-bold text-xs uppercase tracking-widest mt-1'>Manage badges, achievements, and player progression</p>
        </div>
        <div className='flex gap-3'>
          <button 
            onClick={loadData}
            className='p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all text-gray-600 shadow-sm'
            title="Refresh Data"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className='flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg text-xs uppercase tracking-widest'>
            <Settings size={18} /> Engine Settings
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {stats.map((stat, i) => (
          <div key={i} className='bg-white p-6 rounded-[2rem] border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='p-3 bg-orange-50 rounded-2xl'>{stat.icon}</div>
              <span className='text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase tracking-tighter'>{stat.change}</span>
            </div>
            <h3 className='text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1'>{stat.label}</h3>
            <p className='text-3xl font-black text-gray-900 tracking-tighter'>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className='bg-white rounded-[2.5rem] border border-orange-100 shadow-sm overflow-hidden min-h-[600px]'>
        <div className='px-8 pt-6 flex border-b border-orange-50 bg-orange-50/30'>
          <button 
            onClick={() => setActiveTab('badges')}
            className={`pb-4 px-8 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'badges' ? 'text-nestory-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className='flex items-center gap-2'>
              <Award size={16} /> Badges & Awards
            </div>
            {activeTab === 'badges' && <div className='absolute bottom-0 left-0 w-full h-1.5 bg-nestory-600 rounded-t-full shadow-[0_-2px_10px_rgba(249,115,22,0.3)]' />}
          </button>
          <button 
            onClick={() => setActiveTab('milestones')}
            className={`pb-4 px-8 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'milestones' ? 'text-nestory-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className='flex items-center gap-2'>
              <Star size={16} /> Reading Milestones
            </div>
            {activeTab === 'milestones' && <div className='absolute bottom-0 left-0 w-full h-1.5 bg-nestory-600 rounded-t-full shadow-[0_-2px_10px_rgba(249,115,22,0.3)]' />}
          </button>
        </div>

        <div className='p-8'>
           <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mb-8'>
              <div className='relative w-full sm:w-96'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={18} />
                <input 
                  type='text' 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`} 
                  className='w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:bg-white transition-all shadow-inner' 
                />
              </div>
              <div className='flex gap-3 w-full sm:w-auto'>
                <button className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all shadow-sm'><Filter size={18} /> Filter</button>
                <button 
                  onClick={() => {
                    setCreateType(activeTab === 'milestones' ? 'achievement' : 'badge');
                    setShowCreateModal(true);
                  }}
                  className='flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-nestory-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-nestory-700 transition-all shadow-lg shadow-nestory-200 hover:-translate-y-0.5'
                >
                  <Plus size={18} /> Create New
                </button>
              </div>
           </div>

           {/* Create Modal */}
           {showCreateModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl border border-orange-100 flex flex-col max-h-[90vh]">
                 <div className="p-8 border-b border-orange-50 bg-orange-50/30 flex items-center justify-between">
                   <div>
                     <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Create New <span className="text-nestory-600">{createType}</span></h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure your new game element</p>
                   </div>
                   <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-colors">✕</button>
                 </div>
                 
                 <form onSubmit={handleCreate} className="p-8 overflow-y-auto space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                     <div className="col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Display Name</label>
                       <input 
                         required
                         type="text" 
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all"
                         placeholder="e.g. Speed Reader"
                       />
                     </div>
                     <div className="col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Description</label>
                       <textarea 
                         required
                         value={formData.description}
                         onChange={(e) => setFormData({...formData, description: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all min-h-[100px]"
                         placeholder="Describe how to earn this..."
                       />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Icon / Emoji</label>
                        <input 
                          type="text" 
                          value={formData.icon}
                          onChange={(e) => setFormData({...formData, icon: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all text-center"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Points Awarded</label>
                        <input 
                          required
                          type="number" 
                          value={formData.points}
                          onChange={(e) => setFormData({...formData, points: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all"
                        />
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Display Category</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all"
                        >
                          <option value="reading">Reading</option>
                          <option value="streak">Streak</option>
                          <option value="achievement">Achievement</option>
                          <option value="consistency">Consistency</option>
                          <option value="social">Social</option>
                          <option value="special">Special</option>
                          <option value="milestone">Milestone</option>
                          <option value="exploration">Exploration</option>
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Target Threshold</label>
                        <input 
                          required
                          type="number" 
                          value={formData.threshold}
                          onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Requirement Type</label>
                        <select 
                          value={formData.criteriaType}
                          onChange={(e) => setFormData({...formData, criteriaType: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all"
                        >
                          <option value="story_count">Total Stories</option>
                          <option value="days_streak">Streak Days</option>
                          <option value="total_points">Total Points</option>
                          <option value="assignments_completed">Assignments</option>
                          <option value="custom">Custom</option>
                        </select>
                     </div>

                     {createType === 'badge' ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Badge Tier</label>
                          <select 
                            value={formData.tier}
                            onChange={(e) => setFormData({...formData, tier: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all"
                          >
                            <option value="bronze">Bronze</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                          </select>
                        </div>
                     ) : (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Difficulty</label>
                          <select 
                            value={formData.difficulty}
                            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-nestory-500 focus:bg-white rounded-2xl font-bold text-sm transition-all"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                     )}
                   </div>

                   <div className="pt-4 flex gap-4">
                     <button 
                       type="button"
                       onClick={() => setShowCreateModal(false)}
                       className="flex-1 py-4 bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
                     >
                       Cancel
                     </button>
                     <button 
                       type="submit"
                       className="flex-[2] py-4 bg-nestory-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-nestory-700 transition-all shadow-xl shadow-nestory-200"
                     >
                       Finalize & Launch
                     </button>
                   </div>
                 </form>
               </div>
             </div>
           )}

           {loading ? (
             <div className='flex flex-col items-center justify-center py-32 space-y-4'>
                <Loader2 size={48} className='text-nestory-500 animate-spin' />
                <p className='text-gray-400 font-black text-xs uppercase tracking-widest animate-pulse'>Fetching configuration...</p>
             </div>
           ) : (
             <>
               {activeTab === 'badges' && (
                 <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredBadges.length > 0 ? filteredBadges.map((badge) => (
                      <div key={badge.id} className='bg-white border-2 border-orange-50 rounded-[2.5rem] p-7 group hover:border-nestory-300 hover:shadow-2xl hover:shadow-orange-100/50 transition-all duration-300 relative overflow-hidden'>
                        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border-2 ${getTierColor(badge.tier)}`}>
                          {badge.tier}
                        </div>
                        
                        <div className='flex items-start gap-5 mb-6'>
                          <div className='w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-500 ring-4 ring-white'>
                            {badge.icon || '🏅'}
                          </div>
                          <div className='pt-1'>
                            <h4 className='font-black text-gray-900 text-xl tracking-tight leading-tight'>{badge.name}</h4>
                            <p className='text-[10px] font-black text-nestory-600 uppercase tracking-widest mt-1 opacity-70'>{badge.category || 'Achievement'}</p>
                          </div>
                        </div>
                        
                        <p className='text-gray-500 text-sm font-bold leading-relaxed mb-8 min-h-[40px]'>
                          {badge.description}
                        </p>

                        <div className='flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100'>
                          <div className='flex items-center gap-2'>
                            <Zap size={14} className='text-yellow-500 fill-yellow-500' />
                            <span className='text-xs font-black text-gray-700'>{badge.points} PTS</span>
                          </div>
                          <div className='flex gap-1'>
                            <button className='p-2 hover:bg-white hover:text-nestory-600 rounded-lg transition-all text-gray-400'><Edit2 size={16} /></button>
                            <button className='p-2 hover:bg-white hover:text-red-500 rounded-lg transition-all text-gray-400'><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className='col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200'>
                        <Award size={48} className='mx-auto text-gray-300 mb-4' />
                        <h3 className='text-gray-400 font-black text-sm uppercase tracking-widest'>No badges found</h3>
                      </div>
                    )}
                 </div>
               )}

               {activeTab === 'milestones' && (
                 <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredAchievements.length > 0 ? filteredAchievements.map((achievement) => (
                      <div key={achievement.id} className='bg-white border-2 border-orange-50 rounded-[2.5rem] p-7 group hover:border-yellow-300 hover:shadow-2xl hover:shadow-yellow-100/50 transition-all duration-300 relative overflow-hidden'>
                        <div className='absolute -right-4 -top-4 w-24 h-24 bg-yellow-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity'></div>
                        
                        <div className='flex items-start gap-5 mb-6 relative'>
                          <div className='w-16 h-16 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner group-hover:rotate-12 transition-transform duration-500'>
                            {achievement.icon || '⭐'}
                          </div>
                          <div className='pt-1'>
                            <h4 className='font-black text-gray-900 text-lg tracking-tight leading-tight'>{achievement.name}</h4>
                            <div className='flex items-center gap-2 mt-1'>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm ${
                                achievement.difficulty === 'hard' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                achievement.difficulty === 'medium' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                                'bg-green-50 text-green-600 border border-green-100'
                              }`}>
                                {achievement.difficulty || 'easy'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className='text-gray-500 text-sm font-bold leading-relaxed mb-8 min-h-[40px]'>
                          {achievement.description}
                        </p>

                        <div className='space-y-3 relative'>
                          <div className='flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest'>
                             <span>Requirement</span>
                             <span className='text-gray-900'>{achievement.requirements?.threshold || achievement.criteria?.threshold || 0} {achievement.criteria?.type || 'Count'}</span>
                          </div>
                          <div className='h-2.5 w-full bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200'>
                             <div className='h-full bg-yellow-400 rounded-full transition-all duration-1000 w-[75%]'></div>
                          </div>
                        </div>

                        <div className='mt-8 pt-6 border-t border-gray-50 flex items-center justify-between'>
                           <div className='flex items-center gap-2'>
                             <div className='w-8 h-8 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center font-black text-yellow-600 text-xs shadow-sm'>+{achievement.points || 0}</div>
                             <span className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Potential PTS</span>
                           </div>
                           <button className='text-xs font-black text-gray-300 hover:text-gray-500 uppercase tracking-widest transition-colors flex items-center gap-1 group/btn'>
                             Details <Eye size={14} className='group-hover/btn:translate-x-1 transition-transform' />
                           </button>
                        </div>
                      </div>
                    )) : (
                      <div className='col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200'>
                        <Star size={48} className='mx-auto text-gray-300 mb-4' />
                        <h3 className='text-gray-400 font-black text-sm uppercase tracking-widest'>No milestones configured</h3>
                      </div>
                    )}
                 </div>
               )}
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default GamificationAdminPage;

