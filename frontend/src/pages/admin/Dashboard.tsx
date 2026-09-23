import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AdminSearchRequestPopup from "../../components/storyLibrary/AdminSearchRequestPopup";
import { Users, BookOpen, Activity, ArrowUpRight, TrendingUp, UserCheck, ShieldAlert, Settings } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../../services/apiClient";
import StoryService from "../../services/storyService";

interface AdminUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: "parent" | "admin" | "child" | "user";
  isActive?: boolean;
  createdAt?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [storyCount, setStoryCount] = useState(0);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setIsLoading(true);

        const [usersResponse, storiesResponse] = await Promise.all([
          apiClient.getInstance().get("/auth/users"),
          StoryService.getStories(1, 200),
        ]);

        const rawUsers = Array.isArray(usersResponse.data?.data)
          ? usersResponse.data.data
          : [];

        const normalizedUsers = rawUsers.map((item: AdminUser) => ({
          ...item,
          role: item.role === "user" ? "parent" : item.role,
        }));

        setUsers(normalizedUsers);
        setStoryCount(storiesResponse.total || 0);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to load admin dashboard"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((item) => item.isActive !== false).length;
    const parents = users.filter((item) => item.role === "parent").length;
    const admins = users.filter((item) => item.role === "admin").length;
    return { total, active, parents, admins };
  }, [users]);

  const stats = [
    { label: "Total Users", value: userStats.total, icon: Users, color: "text-orange-600", bg: "bg-orange-50", trend: "+12%" },
    { label: "Library Size", value: storyCount, icon: BookOpen, color: "text-nestory-600", bg: "bg-nestory-50", trend: "+5%" },
    { label: "Active Sessions", value: userStats.active, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+18%" },
    { label: "Admin Logs", value: userStats.admins, icon: ShieldAlert, color: "text-blue-600", bg: "bg-blue-50", trend: "Healthy" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <AdminSearchRequestPopup />

      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-nestory-600 to-orange-500 p-8 md:p-12 text-white shadow-xl shadow-nestory-100">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wider mb-6">
            <TrendingUp size={14} />
            SYSTEM OPERATIONAL
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Welcome back, <br/>
            {user?.name?.split(" ")[0] || "Librarian"}!
          </h1>
          <p className="text-orange-50 text-lg opacity-90 leading-relaxed mb-8">
            The Nestory ecosystem is growing. You have {userStats.total} active users and {storyCount} stories currently in the collection.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate("/admin/story-management")}
              className="px-6 py-3 bg-white text-nestory-700 font-bold rounded-xl hover:bg-orange-50 transition-colors shadow-lg flex items-center gap-2"
            >
              Add New Story
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] left-[40%] w-64 h-64 bg-orange-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={"p-3 " + stat.bg + " " + stat.color + " rounded-2xl group-hover:scale-110 transition-transform"}>
                <stat.icon size={24} />
              </div>
              <span className={"text-xs font-bold px-2 py-1 rounded-lg " + (stat.label === "Admin Logs" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600")}>
                {stat.trend}
              </span>
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
              ) : (
                stat.value
              )}
            </h3>
          </div>
        ))}
      </div>

      {/* Secondary Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed / Recent Users */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-orange-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Onboarding</h3>
            <button className="text-nestory-600 text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="divide-y divide-orange-50">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-100 rounded"></div>
                    <div className="h-3 w-48 bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              users.slice(0, 6).map((item) => (
                <div key={item._id || item.id} className="p-4 flex items-center justify-between hover:bg-orange-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-tr from-nestory-100 to-orange-100 rounded-full flex items-center justify-center text-nestory-600 border border-white shadow-sm">
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter " + (item.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700")}>
                      {item.role}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions / System Health */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Tools</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate("/admin/story-management")}
                className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-2xl border border-orange-100 text-nestory-700 hover:bg-orange-100 transition-colors gap-2"
              >
                <BookOpen size={20} />
                <span className="text-xs font-bold">Collection</span>
              </button>
              <button 
                onClick={() => navigate("/admin/users")}
                className="flex flex-col items-center justify-center p-4 bg-nestory-50 rounded-2xl border border-nestory-100 text-nestory-700 hover:bg-nestory-100 transition-colors gap-2"
              >
                <Users size={20} />
                <span className="text-xs font-bold">Users</span>
              </button>
              <button 
                onClick={() => navigate("/admin/settings")}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors gap-2"
              >
                <Settings size={20} />
                <span className="text-xs font-bold">Settings</span>
              </button>
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
