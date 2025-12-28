import React from 'react';
import { 
  Brain, Zap, Target, Trophy, ArrowRight, 
  Users, Sparkles, Activity, ChevronRight 
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight">Memorio</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#methodology" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors hidden md:block">{t('landing.navMethodology')}</a>
            <a href="#exercises" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors hidden md:block">{t('landing.navExercises')}</a>
            <div className="h-6 w-px bg-slate-300 dark:bg-white/10 hidden md:block" />
            <LanguageSelector variant="compact" />
            <ThemeToggle />
            <a href="/login" className="text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition-colors min-h-[44px] inline-flex items-center hidden sm:inline-flex">{t('landing.login')}</a>
            <a href="/signup" className="bg-indigo-600 text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold hover:bg-indigo-500 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50 transition-colors min-h-[44px] inline-flex items-center">
              {t('landing.getStarted')}
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 dark:bg-white/5 dark:border-white/10 text-xs font-medium text-indigo-600 dark:text-indigo-300 mb-8">
            <Sparkles className="w-3 h-3" />
            <span>{t('landing.hero.badge')}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
            {t('landing.hero.title')}
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/signup" className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2">
              {t('landing.hero.startTraining')} <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#methodology" className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10 rounded-full font-bold transition-all flex items-center justify-center gap-2">
              {t('landing.hero.learnMore')}
            </a>
          </div>

          {/* Hero Visual / Dashboard Preview Mockup */}
          <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm p-2 md:p-4 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-2xl" />
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center group">
               {/* Abstract UI Representation */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[80%] h-[80%] bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex gap-6">
                     <div className="w-1/4 h-full space-y-3 hidden md:block">
                        <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="h-4 w-2/3 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg" />
                        <div className="h-4 w-3/4 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg" />
                     </div>
                     <div className="flex-1 h-full space-y-4">
                        <div className="flex gap-4">
                           <div className="h-32 flex-1 bg-gradient-to-br from-indigo-100 to-slate-100 dark:from-indigo-900/40 dark:to-slate-900 rounded-xl border border-indigo-300/40 dark:border-indigo-500/20 flex items-center justify-center">
                               <Activity className="text-indigo-500 w-8 h-8 opacity-50" />
                           </div>
                           <div className="h-32 flex-1 bg-slate-200/30 dark:bg-slate-800/30 rounded-xl border border-slate-300/50 dark:border-white/5" />
                        </div>
                        <div className="h-40 w-full bg-slate-200/30 dark:bg-slate-800/30 rounded-xl border border-slate-300/50 dark:border-white/5 relative overflow-hidden flex items-end justify-center px-6 pb-4 gap-2">
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
      <section id="methodology" className="py-24 bg-slate-50 dark:bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">{t('landing.methodology.title')}</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                {t('landing.methodology.subtitle')}
              </p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Target />} 
                title={t('landing.methodology.feature1.title')} 
                desc={t('landing.methodology.feature1.desc')}
              />
              <FeatureCard 
                icon={<Activity />} 
                title={t('landing.methodology.feature2.title')} 
                desc={t('landing.methodology.feature2.desc')}
              />
              <FeatureCard 
                icon={<Trophy />} 
                title={t('landing.methodology.feature3.title')} 
                desc={t('landing.methodology.feature3.desc')}
              />
           </div>
        </div>
      </section>

      {/* Exercises Showcase */}
      <section id="exercises" className="py-24 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-white/5">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
               <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 dark:text-white">{t('landing.exercises.title')}</h2>
                  <p className="text-slate-600 dark:text-slate-400">{t('landing.exercises.subtitle')}</p>
               </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
               <ExerciseCard 
                  title={t('landing.exercises.exercise1.title')} 
                  subtitle={t('landing.exercises.exercise1.subtitle')}
                  desc={t('landing.exercises.exercise1.desc')}
                  color="bg-purple-500"
                  tags={[t('landing.exercises.exercise1.tag1'), t('landing.exercises.exercise1.tag2')]}
               />
               <ExerciseCard 
                  title={t('landing.exercises.exercise2.title')} 
                  subtitle={t('landing.exercises.exercise2.subtitle')}
                  desc={t('landing.exercises.exercise2.desc')}
                  color="bg-indigo-500"
                  tags={[t('landing.exercises.exercise2.tag1'), t('landing.exercises.exercise2.tag2')]}
               />
               <ExerciseCard 
                  title={t('landing.exercises.exercise3.title')} 
                  subtitle={t('landing.exercises.exercise3.subtitle')}
                  desc={t('landing.exercises.exercise3.desc')}
                  color="bg-cyan-500"
                  tags={[t('landing.exercises.exercise3.tag1'), t('landing.exercises.exercise3.tag2'), t('landing.exercises.exercise3.tag3')]}
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
            <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">{t('landing.social.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              {t('landing.social.subtitle')}
            </p>
         </div>
      </section>


      {/* CTA Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 pt-20 pb-10">
         <div className="max-w-7xl mx-auto px-6">
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-12 text-center relative overflow-hidden mb-20">
               <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10 text-white">{t('landing.cta.title')}</h2>
               <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto relative z-10">
                  {t('landing.cta.subtitle')}
               </p>
               <a href="/signup" className="min-h-[48px] px-10 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-colors shadow-xl relative z-10 inline-flex items-center justify-center">
                  {t('landing.cta.button')}
               </a>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 dark:text-slate-500 text-sm">
               <div className="flex items-center gap-2 mb-4 md:mb-0">
                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
                     <Brain className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-300">Memorio</span>
               </div>
               <div className="flex gap-8">
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('landing.footer.privacy')}</a>
                  <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('landing.footer.terms')}</a>
                  <a href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('landing.footer.contact')}</a>
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
    <div className="p-8 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 dark:bg-slate-900/50 dark:border-white/5 dark:hover:border-indigo-500/30 transition-colors group">
       <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">{title}</h3>
       <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {desc}
       </p>
    </div>
  )
}

function ExerciseCard({ title, subtitle, desc, color, tags }: ExerciseCardProps) {
   return (
      <div className="flex flex-col p-1 rounded-3xl bg-gradient-to-b from-slate-200 to-transparent hover:from-indigo-200/50 dark:from-white/10 dark:hover:from-indigo-500/20 transition-all duration-300 group">
         <div className="flex-1 bg-white dark:bg-slate-950 rounded-[22px] p-8 h-full border border-slate-200 dark:border-white/5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 blur-[50px] rounded-full group-hover:opacity-20 transition-opacity`} />
            
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">{subtitle}</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm leading-relaxed">{desc}</p>
            
            <div className="flex flex-wrap gap-2 mt-auto">
               {tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-slate-300">
                     {tag}
                  </span>
               ))}
            </div>
         </div>
      </div>
   )
}
