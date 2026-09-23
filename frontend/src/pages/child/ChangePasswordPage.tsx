import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Lock, ShieldCheck, Sparkle } from "lucide-react";
import ChildSidebar from "../../components/common/ChildSidebar";
import BookTopBar from "../../components/child/BookTopBar";
import authService from "../../services/authService";

const ChildChangePasswordPage = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match!");
    }
    try {
      setIsLoading(true);
      await authService.changePassword({
        currentPassword: oldPassword,
        newPassword: newPassword,
      });
      toast.success("Security code updated!");
      navigate("/child/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Oops! Failed to update.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] pl-20 pb-12 transition-all duration-500">
      <ChildSidebar />
      <div className="max-w-[1400px] mx-auto px-10 pt-4">
        <BookTopBar searchQuery="" setSearchQuery={() => {}} onSearch={() => {}} />

        <div className="flex items-center gap-4 mb-10">
           <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl border border-[#E8E2D5] hover:bg-rose-50 transition-colors text-gray-600 shadow-sm active:scale-95">
              <ArrowLeft size={20} />
           </button>
           <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Security Zone</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
           {/* Left: Illustrations/Theme */}
           <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="bg-rose-500 rounded-[4rem] p-12 text-white shadow-2xl shadow-rose-200/50 aspect-square flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 animate-bounce">
                    <ShieldCheck size={48} />
                 </div>
                 <h2 className="text-4xl font-black uppercase tracking-tight mb-4 leading-tight">Secret Portal Protection</h2>
                 <p className="text-sm font-bold opacity-80 uppercase tracking-widest px-10">Choose a strong secret code that only you and your parents know! 🔐</p>
              </div>
           </div>

           {/* Right: The Form */}
           <div className="bg-white/60 backdrop-blur-xl p-10 sm:p-14 rounded-[4rem] border border-white shadow-xl shadow-gray-200/40 animate-in fade-in slide-in-from-right-8 duration-700 delay-200 relative overflow-hidden">
              <div className="absolute top-10 right-10 text-rose-500 opacity-20">
                 <Sparkle size={100} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                 <div className="space-y-6">
                    <div className="group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Current Secret Code</label>
                       <div className="relative">
                          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                          <input 
                             type="password"
                             value={oldPassword}
                             onChange={(e) => setOldPassword(e.target.value)}
                             required
                             placeholder="Old password..."
                             className="w-full h-16 bg-white border border-[#E8E2D5] rounded-3xl pl-16 pr-6 text-sm font-black focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                          />
                       </div>
                    </div>

                    <div className="group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">New Secret Code</label>
                       <div className="relative">
                          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                          <input 
                             type="password"
                             value={newPassword}
                             onChange={(e) => setNewPassword(e.target.value)}
                             required
                             placeholder="New password..."
                             className="w-full h-16 bg-white border border-[#E8E2D5] rounded-3xl pl-16 pr-6 text-sm font-black focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                          />
                       </div>
                    </div>

                    <div className="group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Confirm New Code</label>
                       <div className="relative">
                          <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                          <input 
                             type="password"
                             value={confirmPassword}
                             onChange={(e) => setConfirmPassword(e.target.value)}
                             required
                             placeholder="Confirm password..."
                             className="w-full h-16 bg-white border border-[#E8E2D5] rounded-3xl pl-16 pr-6 text-sm font-black focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-6 bg-rose-500 text-white text-lg font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-4"
                 >
                    {isLoading ? "UPDATING SECRET CODE..." : "UPDATE SECURITY"}
                 </button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChildChangePasswordPage;
