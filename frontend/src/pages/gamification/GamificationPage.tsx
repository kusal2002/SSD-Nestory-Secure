import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";
import { 
  Sparkles, Trophy, Award, ShieldCheck, ListChecks, 
  TrendingUp, Flame, ArrowLeft 
} from "lucide-react";
import toast from "react-hot-toast";
import FamilyService from "../../services/familyService";
import AssignmentService from "../../services/assignmentService";
import GamificationService from "../../services/gamificationService";
import {
  GamificationProgress,
  GamificationBadgeProgress,
  GamificationAchievementProgress,
  GamificationBadge,
  LeaderboardEntry,
} from "../../types";

const maxLeaderboardItems = 6;

// Generate a consistent emoji based on child name
const getChildEmoji = (name: string): string => {
  const emojis = ['🧒', '👧', '👦', '🎀', '⭐', '🌟', '🎨', '🎭', '🎪', '🎯'];
  const index = name.charCodeAt(0) % emojis.length;
  return emojis[index];
};

const GamificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState<GamificationProgress | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<GamificationBadgeProgress[]>([]);
  const [achievements, setAchievements] = useState<GamificationAchievementProgress[]>([]);
  const [availableBadges, setAvailableBadges] = useState<GamificationBadge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [childrenXp, setChildrenXp] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isParent = user?.role === "parent";

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        if (isParent) {
          const myFamily = await FamilyService.getMyFamily();
          if (myFamily && myFamily.children) {
            const childrenWithStats = await Promise.all(
              myFamily.children.map(async (child: any) => {
                const [prog, overview] = await Promise.all([
                  GamificationService.getUserProgress(user.id, child.id),
                  AssignmentService.getParentProgressOverview(child.id)
                ]);
                
                // Calculate success rate from overview
                const total = overview.assignments.length;
                const completedOnTime = overview.assignments.filter(
                  (a: any) => a.status === 'completed' && a.deadlineVsCompletion?.outcome !== 'late'
                ).length;
                
                return {
                  ...child,
                  xp: prog.totalPoints,
                  level: prog.level,
                  streak: prog.currentStreak,
                  successRate: total > 0 ? Math.round((completedOnTime / total) * 100) : 0,
                  totalBooks: total
                };
              })
            );
            setChildrenXp(childrenWithStats);
          }
        }

        const [progressData, badgesData, achievementsData, allBadgesData, leaderboardData] =
          await Promise.all([
            GamificationService.getUserProgress(user.id),
            GamificationService.getUserBadges(user.id),
            GamificationService.getUserAchievements(user.id),
            GamificationService.getAllBadges(undefined, undefined, true),
            GamificationService.getLeaderboard(maxLeaderboardItems, user.role === "child"),
          ]);

        setProgress(progressData);
        setEarnedBadges(badgesData);
        setAchievements(achievementsData);
        setAvailableBadges(
          allBadgesData.filter((badge) =>
            !badgesData.some((earned) => earned.badge.id === badge.id)
          )
        );
        setLeaderboard(leaderboardData);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Unable to load gamification data");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#F5F1E9] pl-20 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isParent ? "bg-white" : "bg-[#F5F1E9] pl-20 pb-12 transition-colors duration-500"}`}>
      {!isParent && <ChildSidebar />}
      
      <div className={`max-w-[1400px] mx-auto ${isParent ? "px-4 sm:px-6 lg:px-8 py-8" : "px-10 pt-4"}`}>
        {!isParent && <BookTopBar searchQuery="" setSearchQuery={() => {}} onSearch={() => {}} />}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10 mt-6">
          <div className="flex items-center gap-4">
            {!isParent && (
              <button onClick={() => navigate("/child")} className="p-3 bg-white rounded-2xl border border-[#E8E2D5] hover:bg-rose-50 transition-colors text-gray-600 shadow-sm active:scale-95">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-black text-gray-800 tracking-tight uppercase ${isParent ? "text-4xl md:text-5xl" : ""}`}>
                {isParent ? <>Hall of <span className="text-rose-500">Fame</span></> : "Level Up!"}
              </h1>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                {isParent ? "Track points, badges, and milestones across your family." : "Collect points, badges, and rule the leaderboard!"}
              </p>
            </div>
          </div>
        </div>

        {isParent && childrenXp.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {childrenXp.map((child) => (
              <div key={child.id} className="bg-white rounded-[2.5rem] p-8 border border-[#E8E2D5] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-rose-50 border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                    {child.avatar ? (
                      <img 
                        src={child.avatar} 
                        alt={child.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load, show emoji
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const emoji = getChildEmoji(child.name);
                          const span = document.createElement('span');
                          span.className = 'text-4xl';
                          span.textContent = emoji;
                          target.parentElement?.appendChild(span);
                        }}
                      />
                    ) : (
                      <span className="text-4xl">{getChildEmoji(child.name)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight truncate">{child.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Level {child.level}</span>
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{child.xp} XP</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="bg-[#F5F1E9]/50 rounded-2xl p-4 border border-[#E8E2D5]/50">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck size={14} className="text-blue-500" />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Success Rate</span>
                    </div>
                    <p className="text-xl font-black text-gray-800">{child.successRate}%</p>
                  </div>
                  <div className="bg-[#F5F1E9]/50 rounded-2xl p-4 border border-[#E8E2D5]/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame size={14} className="text-orange-500" />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Daily Streak</span>
                    </div>
                    <p className="text-xl font-black text-gray-800">{child.streak}d</p>
                  </div>
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reading Progress</span>
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">{child.totalBooks} Stories</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000"
                      style={{ width: `${child.successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {[
            { label: "Total XP", val: progress?.totalPoints ?? 0, icon: <Sparkles className="text-blue-500" />, bg: "bg-blue-50", key: "xp" },
            { label: "My Level", val: progress?.level ?? 1, icon: <Trophy className="text-purple-500" />, bg: "bg-purple-50", key: "lvl" },
            { label: "Max Streak", val: `${progress?.currentStreak ?? 0}d`, icon: <Flame className="text-orange-500" />, bg: "bg-orange-50", key: "streak" },
            { label: "Books Done", val: progress?.stats.storiesRead ?? 0, icon: <ListChecks className="text-rose-500" />, bg: "bg-rose-50", key: "books" }
          ].map((s) => (
            <div key={s.key} className="bg-white p-8 rounded-[2.5rem] border border-[#E8E2D5] shadow-sm text-center transform hover:scale-105 transition-all group">
              <div className={`w-16 h-16 ${s.bg} rounded-3xl flex items-center justify-center mb-4 mx-auto border border-white shadow-inner`}>
                {React.cloneElement(s.icon as React.ReactElement, { size: 28 })}
              </div>
              <p className="text-3xl font-black text-gray-800 mb-1">{s.val}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          <div className="xl:col-span-2 space-y-10">
            {/* Earned Badges */}
            <section className="bg-white rounded-[2.5rem] p-10 border border-[#E8E2D5] shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                     <Award className="text-rose-500" size={22} />
                   </div>
                   <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">My Achievements</h2>
                </div>
                <span className="px-4 py-2 bg-[#F5F1E9] rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-[#E8E2D5]">
                  {earnedBadges.length} Collected
                </span>
              </div>
              
              {earnedBadges.length === 0 ? (
                <div className="py-16 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                   <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No badges yet. Start reading to earn some! 📚</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {earnedBadges.map((item) => (
                    <div key={item.id || `earned-${item.badge.id}`} className="group bg-[#F5F1E9]/50 border border-[#E8E2D5] rounded-[2rem] p-6 hover:bg-white hover:shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-white rounded-2xl border border-[#E8E2D5] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                          {item.badge.icon || "🏅"}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-rose-500">{item.badge.points}</div>
                          <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Points</div>
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-2 truncate">{item.badge.name}</h3>
                      <p className="text-xs font-bold text-gray-500 leading-relaxed mb-4">{item.badge.description}</p>
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Unlocked {item.earnedAt ? new Date(item.earnedAt).toLocaleDateString() : "Just Now"}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Locked Badges */}
            <section className="bg-white rounded-[2.5rem] p-10 border border-[#E8E2D5] shadow-sm">
               <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                    <ShieldCheck className="text-blue-500" size={22} />
                  </div>
                  <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Locked Challenges</h2>
               </div>
               <div className="space-y-6">
                 {availableBadges.length === 0 ? (
                   <div className="py-8 text-center text-gray-400 uppercase text-xs font-black tracking-widest">You have earned all available badges! 🎊</div>
                 ) : (
                   availableBadges.slice(0, 4).map((badge) => (
                     <div key={badge.id || badge.name} className="flex items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-white transition-all opacity-70 hover:opacity-100 group">
                       <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all text-2xl shadow-sm">
                          {badge.icon || "🔒"}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                             <h4 className="font-black text-gray-800 uppercase tracking-tight truncate pr-2">{badge.name}</h4>
                             <span className="text-[10px] font-black text-blue-500 shrink-0">{badge.points} XP</span>
                          </div>
                          <p className="text-xs font-bold text-gray-400">{badge.description}</p>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </section>
          </div>

          <div className="space-y-10">
            {/* Leaderboard */}
            <section className="bg-white rounded-[2.5rem] p-10 border border-[#E8E2D5] shadow-sm">
               <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                    <TrendingUp className="text-amber-500" size={22} />
                  </div>
                  <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Leaderboard</h2>
               </div>
               <div className="space-y-4">
                  {leaderboard.length === 0 ? (
                    <p className="text-center py-10 text-gray-400 font-bold uppercase text-xs tracking-widest">No entries yet...</p>
                  ) : (
                    leaderboard.map((entry, idx) => (
                      <div key={entry.id || entry.user?.id || entry.child?.id || idx} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${idx === 0 ? "bg-amber-50 border-amber-200 scale-105 shadow-md" : (entry.user?.id === user?.id || entry.child?.id === user?.id) ? "bg-rose-50 border-rose-200" : "bg-white border-[#E8E2D5]"}`}>
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${idx === 0 ? "bg-amber-100 text-amber-700" : (idx === 1 ? "bg-gray-100 text-gray-600" : (idx === 2 ? "bg-orange-100 text-orange-700" : "text-gray-400"))}`}>
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-800 truncate uppercase tracking-tight text-sm">
                              {entry.child?.name || "Unknown"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{entry.totalPoints} XP</span>
                               <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                               <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">LVL {entry.level}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-1 text-orange-500 px-3 py-1 bg-white rounded-full border border-orange-100 shadow-sm shrink-0">
                            <Flame size={14} className="fill-orange-500" />
                            <span className="font-black text-xs">{entry.currentStreak}d</span>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </section>

            {/* Quests (Achievements) */}
            <section className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-xl shadow-gray-200 relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
               <h3 className="text-xl font-black uppercase tracking-tight mb-8 relative z-10">Quest Tracker</h3>
               <div className="space-y-8 relative z-10">
                  {achievements.length === 0 ? (
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">No active quests found.</p>
                  ) : (
                    achievements.slice(0, 3).map((item) => (
                      <div key={item.id || item.achievement.id} className="space-y-3">
                         <div className="flex justify-between items-end">
                            <div className="min-w-0">
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{Math.round((item.progress / item.achievement.targetValue) * 100)}% Complete</div>
                              <div className="font-black uppercase tracking-tight text-sm truncate">{item.achievement.name}</div>
                            </div>
                            <div className="text-rose-400 font-black text-sm shrink-0">+{item.achievement.points} pts</div>
                         </div>
                         <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/5 p-1">
                            <div 
                               className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000"
                               style={{ width: `${Math.min(100, (item.progress / item.achievement.targetValue) * 100)}%` }}
                            />
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationPage;
