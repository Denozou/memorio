import React from 'react';
import { 
  Brain, Zap, Target, Trophy, ArrowRight, 
  Users, Sparkles, Activity, ChevronRight 
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

interface ExerciseCardProps {
  title: string;
  subtitle: string;
  desc: string;
  color: string;
  tags: string[];
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">Memorio</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#methodology" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">Methodology</a>
            <a href="#exercises" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">Exercises</a>
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <a href="/login" className="text-sm font-medium text-white hover:text-indigo-400 transition-colors min-h-[44px] inline-flex items-center">Log in</a>
            <a href="/signup" className="bg-white text-slate-950 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-50 transition-colors min-h-[44px] inline-flex items-center">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-[100%] blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-[100%] blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8">
            <Sparkles className="w-3 h-3" />
            <span>Science-backed memory training</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Stop forgetting.<br />Start mastering.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Train your brain with the techniques used by memory champions. 
            Master names, numbers, and lists through active recall and spaced repetition.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/signup" className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2">
              Start Training Now <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#methodology" className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold transition-all flex items-center justify-center gap-2">
              Learn More
            </a>
          </div>

          {/* Hero Visual / Dashboard Preview Mockup */}
          <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-2 md:p-4 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-2xl" />
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-950 border border-slate-800 flex items-center justify-center group">
               {/* Abstract UI Representation */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[80%] h-[80%] bg-slate-900 rounded-xl border border-slate-800 shadow-2xl p-6 flex gap-6">
                     <div className="w-1/4 h-full space-y-3 hidden md:block">
                        <div className="h-8 w-full bg-slate-800 rounded-lg" />
                        <div className="h-4 w-2/3 bg-slate-800/50 rounded-lg" />
                        <div className="h-4 w-3/4 bg-slate-800/50 rounded-lg" />
                     </div>
                     <div className="flex-1 h-full space-y-4">
                        <div className="flex gap-4">
                           <div className="h-32 flex-1 bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-xl border border-indigo-500/20 flex items-center justify-center">
                               <Activity className="text-indigo-500 w-8 h-8 opacity-50" />
                           </div>
                           <div className="h-32 flex-1 bg-slate-800/30 rounded-xl border border-white/5" />
                        </div>
                        <div className="h-40 w-full bg-slate-800/30 rounded-xl border border-white/5 relative overflow-hidden flex items-end justify-center px-6 pb-4 gap-2">
                           {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                              <div key={i} style={{ height: `${h}%` }} className="w-full bg-indigo-500 rounded-t-sm opacity-60" />
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="methodology" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for results.</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                We don't just flash cards at you. We use proven cognitive science to ensure information moves from short-term to long-term memory.
              </p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Target />} 
                title="BKT Algorithm" 
                desc="Bayesian Knowledge Tracing predicts exactly when you're about to forget something and schedules a review."
              />
              <FeatureCard 
                icon={<Activity />} 
                title="Active Recall" 
                desc="Move beyond passive reading. Our exercises force your brain to retrieve information actively."
              />
              <FeatureCard 
                icon={<Trophy />} 
                title="Gamified Progress" 
                desc="Earn badges, maintain streaks, and grow your forest. Making memory training addictive."
              />
           </div>
        </div>
      </section>

      {/* Exercises Showcase */}
      <section id="exercises" className="py-24 bg-slate-900/50 border-y border-white/5">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
               <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">Core Exercises</h2>
                  <p className="text-slate-400">Targeted workouts for different memory types.</p>
               </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
               <ExerciseCard 
                  title="Word Linking" 
                  subtitle="Chain Method"
                  desc="Memorize long lists of items by creating vivid narrative chains."
                  color="bg-purple-500"
                  tags={["Lists", "Speeches"]}
               />
               <ExerciseCard 
                  title="Names & Faces" 
                  subtitle="Social Recall"
                  desc="Never forget a name again. Learn to tag visual features to names."
                  color="bg-indigo-500"
                  tags={["Networking", "Social"]}
               />
               <ExerciseCard 
                  title="Number Pegs" 
                  subtitle="Abstract Data"
                  desc="Convert abstract numbers into concrete images using the Major System."
                  color="bg-cyan-500"
                  tags={["Phone #s", "Dates", "PINs"]}
               />
            </div>
         </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center p-3 mb-8 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
               <Users className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Join Brain Athletes Worldwide</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Train alongside students, professionals, and memory champions building cognitive resilience through science-backed techniques.
            </p>
         </div>
      </section>


      {/* CTA Footer */}
      <footer className="border-t border-white/10 bg-slate-950 pt-20 pb-10">
         <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-12 text-center relative overflow-hidden mb-20">
               <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to upgrade your mind?</h2>
               <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto relative z-10">
                  Join today and get your first personalized training plan for free. No credit card required.
               </p>
               <a href="/signup" className="min-h-[48px] px-10 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-colors shadow-xl relative z-10 inline-flex items-center justify-center">
                  Get Started for Free
               </a>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm">
               <div className="flex items-center gap-2 mb-4 md:mb-0">
                  <div className="w-6 h-6 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                     <Brain className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-300">Memorio</span>
               </div>
               <div className="flex gap-8">
                  <a href="#" className="hover:text-white transition-colors">Privacy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms</a>
                  <a href="#" className="hover:text-white transition-colors">Contact</a>
               </div>
               <div className="mt-4 md:mt-0">
                  © {new Date().getFullYear()} Memorio
               </div>
            </div>
         </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors group">
       <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <h3 className="text-xl font-bold mb-3 text-slate-100">{title}</h3>
       <p className="text-slate-400 leading-relaxed">
          {desc}
       </p>
    </div>
  )
}

function ExerciseCard({ title, subtitle, desc, color, tags }: ExerciseCardProps) {
   return (
      <div className="flex flex-col p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent hover:from-indigo-500/20 transition-all duration-300 group">
         <div className="flex-1 bg-slate-950 rounded-[22px] p-8 h-full border border-white/5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 blur-[50px] rounded-full group-hover:opacity-20 transition-opacity`} />
            
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">{subtitle}</div>
            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">{desc}</p>
            
            <div className="flex flex-wrap gap-2 mt-auto">
               {tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-slate-300">
                     {tag}
                  </span>
               ))}
            </div>
         </div>
      </div>
   )
}
