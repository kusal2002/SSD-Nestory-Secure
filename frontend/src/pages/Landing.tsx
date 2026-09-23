import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, Zap, BarChart3, MessageCircle, Trophy, 
  ArrowRight, Check, Star, Sparkles, Heart, Shield, 
  Gamepad2, Library, LayoutDashboard, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-[#FAFAFA] text-gray-900 selection:bg-rose-100 selection:text-rose-600">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="bg-gradient-to-br from-rose-500 to-orange-400 p-2 rounded-xl border-b-4 border-rose-700 shadow-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-gray-800 tracking-tight">NE<span className="text-rose-500">STORY</span></span>
          </motion.div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-gray-500 hover:text-rose-500 font-bold uppercase text-xs tracking-widest transition-colors"
            >
              Login
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-rose-500 text-white rounded-xl border-b-4 border-rose-700 hover:bg-rose-600 font-black uppercase text-xs tracking-widest shadow-lg transition-all"
            >
              Join Us
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px]">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-rose-100/30 blur-[120px] rounded-full -z-10 animate-pulse" />
        
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black uppercase tracking-[0.2em] bg-rose-50 text-rose-500 border border-rose-100 rounded-full">
              ✨ The Future of Family Reading
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tight">
              Turn Reading Into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-500 to-rose-600">Epic Adventures</span>
            </h1>
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto font-bold leading-relaxed">
              Nestory isn't just an app—it's a magical bridge connecting parents and children through the power of stories, gamification, and family connection.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-10 py-5 bg-rose-500 text-white rounded-3xl border-b-8 border-rose-700 hover:bg-rose-600 font-black text-lg uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all"
            >
              Start Adventure <ArrowRight className="w-6 h-6" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: 'white' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-10 py-5 bg-transparent border-4 border-gray-200 text-gray-800 rounded-3xl font-black text-lg uppercase tracking-widest hover:border-rose-500 hover:text-rose-500 transition-all"
            >
              View Dashboard
            </motion.button>
          </motion.div>

          {/* Floating Elements */}
          <div className="hidden lg:block">
            <motion.div 
              animate={{ y: [0, -20, 0] }} 
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -left-20 top-0 bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 flex items-center gap-4 max-w-[200px]"
            >
              <div className="bg-rose-100 p-3 rounded-2xl text-rose-500"><Trophy size={24} /></div>
              <div className="text-left"><p className="text-[10px] font-black text-gray-400 uppercase">New Badge</p><p className="text-sm font-black">Story King</p></div>
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0] }} 
              transition={{ repeat: Infinity, duration: 5, delay: 0.5 }}
              className="absolute -right-20 top-40 bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 flex items-center gap-4 max-w-[200px]"
            >
              <div className="bg-orange-100 p-3 rounded-2xl text-orange-500"><MessageCircle size={24} /></div>
              <div className="text-left"><p className="text-[10px] font-black text-gray-400 uppercase">Family Chat</p><p className="text-sm font-black">Dad: Great job!</p></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tight">
              Powerful Tools for <span className="text-rose-500">Every Family</span>
            </h2>
            <div className="w-24 h-2 bg-rose-500 mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: "Family Chat Hub",
                desc: "Real-time communication bridge where parents and children share reactions, highlights, and motivation during reading sessions.",
                color: "bg-rose-500",
                light: "bg-rose-50"
              },
              {
                icon: <Library className="w-8 h-8" />,
                title: "Smart Library",
                desc: "Manage and assign curated stories powered by Google Books API, tailored to your child's age and interests.",
                color: "bg-orange-500",
                light: "bg-orange-50"
              },
              {
                icon: <Gamepad2 className="w-8 h-8" />,
                title: "Gamification Engine",
                desc: "Turn progress into points. Children earn XP, unlock mysterious badges, and climb levels as they finish books.",
                color: "bg-purple-500",
                light: "bg-purple-50"
              },
              {
                icon: <LayoutDashboard className="w-8 h-8" />,
                title: "Child Dashboard",
                desc: "A distraction-free, playful interface designed for children to focus on reading and celebrating their growth.",
                color: "bg-blue-500",
                light: "bg-blue-50"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Parent Analytics",
                desc: "Comprehensive insights into reading frequency, comprehension milestones, and personalized growth reports.",
                color: "bg-teal-500",
                light: "bg-teal-50"
              },
              {
                icon: <Share2 className="w-8 h-8" />,
                title: "Social Connection",
                desc: "Auto-generated family groups ensure that everyone stays in the loop—from grandparents to siblings.",
                color: "bg-indigo-500",
                light: "bg-indigo-50"
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all"
              >
                <div className={`${f.light} p-4 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform`}>
                  <div className={`text-white ${f.color} p-3 rounded-xl`}>{f.icon}</div>
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-4 uppercase tracking-tight">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed font-bold text-sm">
                  {f.desc}
                </p>
                <div className="absolute top-10 right-10 text-gray-100 text-6xl font-black -z-10 opacity-40">0{i+1}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Progress Journey */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-rose-500/10 blur-[150px] -z-0" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-rose-500 font-black uppercase tracking-widest text-xs mb-4 block">Interactive Learning</span>
              <h2 className="text-5xl font-black mb-8 leading-tight">HOW THE <span className="text-rose-500">MAGIC</span> HAPPENS</h2>
              <div className="space-y-8">
                {[
                  { title: "Onboarding", text: "Parents set up their family workspace in seconds." },
                  { title: "Discovery", text: "Assign exciting stories from our global library." },
                  { title: "Engagement", text: "Children read and interact via the playful dashboard." },
                  { title: "Celebration", text: "Sync points, unlock badges, and chat as a family." }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight mb-1">{step.title}</h4>
                      <p className="text-gray-400 font-bold text-sm">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              style={{ perspective: 1000 }}
              className="relative"
            >
              <motion.div 
                whileHover={{ rotateY: -10, rotateX: 5 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[4rem] shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-rose-500 rounded-2xl shadow-lg border-b-4 border-rose-700" />
                  <div className="h-4 w-32 bg-white/20 rounded-full" />
                </div>
                <div className="space-y-4">
                  <div className="h-20 w-full bg-white/5 rounded-3xl border border-white/10" />
                  <div className="h-20 w-3/4 bg-white/5 rounded-3xl border border-white/10" />
                  <div className="h-20 w-full bg-white/5 rounded-3xl border border-white/10" />
                </div>
                <div className="mt-12 flex justify-center">
                  <div className="p-4 bg-rose-500 rounded-full animate-bounce">
                    <Sparkles className="text-white" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Parent Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-12 bg-[#F5F1E9] rounded-[4rem] border-2 border-transparent hover:border-gray-200 transition-all"
            >
              <div className="bg-white p-4 rounded-3xl w-fit mb-8 shadow-sm">
                <Heart className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-3xl font-black mb-8 uppercase tracking-tight">For The <span className="text-rose-500">Parents</span></h3>
              <ul className="space-y-5">
                {[
                  'Stay connected even when you are working',
                  'High-level overview of reading progress',
                  'Safe, controlled environment for your child',
                  'Encourage reading habits with zero friction',
                  'Build lasting memories via family chat'
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-bold text-gray-600">
                    <div className="p-1 bg-green-100 text-green-600 rounded-full"><Check size={14} /></div>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Child Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-12 bg-gray-50 rounded-[4rem] border-2 border-transparent hover:border-gray-200 transition-all"
            >
              <div className="bg-white p-4 rounded-3xl w-fit mb-8 shadow-sm">
                <Gamepad2 className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-3xl font-black mb-8 uppercase tracking-tight">For The <span className="text-blue-500">Explorer</span></h3>
              <ul className="space-y-5">
                {[
                  'Unlock special badges and achievements',
                  'Fun and playful reading interface',
                  'Direct line to family for sharing excitement',
                  'Personalized library of assigned stories',
                  'Track your own growth journey'
                ].map((b, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm font-bold text-gray-600">
                    <div className="p-1 bg-blue-100 text-blue-600 rounded-full"><Check size={14} /></div>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-rose-500 rounded-[5rem] p-16 md:p-24 overflow-hidden text-center text-white border-b-8 border-rose-700 shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,white_0.1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                READY TO START THE <br />NEXT CHAPTER?
              </h2>
              <p className="text-xl font-bold mb-12 opacity-90 max-w-xl mx-auto">
                Join our community of happy families and turn every book into a shared celebration.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="px-12 py-6 bg-white text-rose-500 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl transition-all"
                >
                  Join For Free
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAFAFA] border-t border-gray-100 py-20 px-4 sm:px-6 lg:px-8 font-bold">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <div className="bg-gray-900 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-gray-800 tracking-tight uppercase">Nestory</span>
          </div>
          <div className="flex gap-12 text-sm uppercase tracking-widest text-gray-400">
            <a href="#" className="hover:text-rose-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-rose-500 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-widest">© 2026 Nestory Foundation</p>
        </div>
      </footer>
    </div>
  );
}
