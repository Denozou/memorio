import { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { 
  Flame, TrendingUp, Award, Clock, LogOut, Menu, X,
  Play, Lightbulb, Target, BookOpen, Brain
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import AdaptiveDifficultyWidget from "../components/AdaptiveDifficultyWidget";
import ReviewNotificationBadge from "../components/ReviewNotificationBadge";

type Streak = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; //date (YYYY-MM-DD) or null
  timezone: string;
};

type HistoryItem = {
  sessionId: string;
  type: "WORD_LINKING" | "NAMES_FACES" | "OBJECT_STORY" | "DAILY_CHALLENGE";
  startedAt: string;        // datetime
  finishedAt: string | null;
  attemptCount: number;
  lastCorrect: number | null;
  lastTotal: number | null;
  lastAccuracy: number | null; // 0..1 or null
};

type HistoryResponse = {
  items: HistoryItem[];
  limit: number;
  offset: number;
  total: number;
};

type Progress = {
  totalPoints: number;
  totalAttempts: number;
  totalCorrect: number;
  badges: string[];
};

export default function Dashboard() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTip, setShowTip] = useState(true);

  const [streak, setStreak] = useState<Streak | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [streakErr, setStreakErr] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [histErr, setHistErr] = useState<string | null>(null);

  const [progress, setProgress] = useState<Progress | null>(null);
  const [loadingProg, setLoadingProg] = useState(false);
  const [progErr, setProgErr] = useState<string | null>(null);

  // Pick a random tip
  const dailyTip = useMemo(() => {
    const tips = t('dashboard.tips', { returnObjects: true }) as string[];
    return tips[Math.floor(Math.random() * tips.length)];
  }, [t]);

  // Calculate accuracy trend for sparkline
  const accuracyTrend = useMemo(() => {
    if (!history || history.length === 0) return [];
    const sorted = [...history].sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    return sorted.slice(0, 15).reverse().map(h => 
      h.lastAccuracy ? Math.round(h.lastAccuracy * 100) : 0
    );
  }, [history]);

  const recentSessions = useMemo(() => {
    if (!history) return [];
    const sorted = [...history].sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    return sorted.slice(0, 10);
  }, [history]);

  const loading = loadingStreak || loadingHist || loadingProg;

  useEffect(() => {
    let alive = true;

    // Load streak
    (async () => {
      setLoadingStreak(true);
      setStreakErr(null);
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const { data } = await api.get<Streak>("/exercises/streak", { params: { tz } });
        if (alive) setStreak(data);
      } catch (e: any) {
        if (alive) setStreakErr(e?.response?.data?.error ?? "Failed to load streak");
      } finally {
        if (alive) setLoadingStreak(false);
      }
    })();

    // Load history (last 60 days for heatmap, but we'll use all available)
    (async () => {
      setLoadingHist(true);
      setHistErr(null);
      try {
        const { data } = await api.get<HistoryResponse>("/exercises/history", {
          params: { limit: 200, offset: 0 },
        });
        if (alive) setHistory(data.items);
      } catch (e: any) {
        if (alive) setHistErr(e?.response?.data?.error ?? "Failed to load history");
      } finally {
        if (alive) setLoadingHist(false);
      }
    })();

    // Load progress (points & baddges)
    (async () => {
      setLoadingProg(true);
      setProgErr(null);
      try {
        const { data } = await api.get<Progress>("/progress");
        setProgress(data);
      } catch (e: any) {
        setProgErr(e?.response?.data?.error ?? "Failed to load progress");
      } finally {
        setLoadingProg(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
      nav("/login");
    } catch (e) {
      console.error("Logout failed", e);
      nav("/login");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">Memorio</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm text-slate-900 dark:text-slate-50 font-medium inline-flex items-center">
                {t('common.dashboard')}
                <ReviewNotificationBadge />
              </Link>
              <Link to="/leaderboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.leaderboard')}
              </Link>
              <Link to="/learning" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.learning')}
              </Link>
              <Link to="/profile" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.profile')}
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-slate-300/70 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('common.logout')}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className="p-2 rounded-lg border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                <Link to="/dashboard" className="py-2 text-slate-900 dark:text-slate-50 font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.dashboard')}
                </Link>
                <Link to="/leaderboard" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.leaderboard')}
                </Link>
                <Link to="/learning" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.learning')}
                </Link>
                <Link to="/profile" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.profile')}
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="py-2 text-left text-slate-600 dark:text-slate-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
        
        {/* 1. TIP OF THE DAY (Dismissible) */}
        {showTip && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 relative rounded-xl sm:rounded-2xl border border-amber-200 dark:border-amber-800 p-3 sm:p-4 flex gap-3 sm:gap-4 items-start shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:bg-none dark:bg-slate-900">
            <div className="p-1.5 sm:p-2 bg-white dark:bg-amber-900/60 rounded-lg sm:rounded-xl text-amber-500 dark:text-amber-300 shadow-sm border border-amber-100 dark:border-amber-800/50 shrink-0">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
              <h4 className="font-bold text-amber-900 dark:text-amber-100 text-xs sm:text-sm mb-1">{t('dashboard.memoryTip')}</h4>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">{dailyTip}</p>
            </div>
            <button 
              onClick={() => setShowTip(false)}
              className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* 2. HERO: DAILY WORKOUT */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 dark:bg-slate-950 shadow-xl group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 opacity-100" />
          
          {/* Abstract Shapes */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl group-hover:bg-white/15 transition-colors duration-700" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-indigo-500/30 blur-3xl" />
          
          <div className="relative p-5 sm:p-8 lg:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-8">
            <div className="space-y-3 sm:space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 backdrop-blur-md text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-indigo-100">
                <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                {t('dashboard.spacedRepetition')}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {t('dashboard.heroTitle')}
              </h1>
              <p className="text-indigo-100 text-sm sm:text-base lg:text-lg leading-relaxed">
                {t('dashboard.heroDescription')}
              </p>
            </div>
            
            <Link
              to="/exercise/word-linking"
              className="w-full md:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-indigo-700 font-bold rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-900/20 hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>{t('dashboard.startWorkout')}</span>
            </Link>
          </div>
        </div>

        {/* 3. EXERCISE CARDS GRID */}
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
             <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              {t('common.exercises')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <ExerciseCard 
              title={t('exercises.wordLinking')}
              desc={t('exercises.wordLinkingDesc')}
              icon="🔗"
              color="indigo"
              route="/exercise/word-linking"
            />
            <ExerciseCard 
              title={t('exercises.namesFaces')}
              desc={t('exercises.namesFacesDesc')}
              icon="👤"
              color="violet"
              route="/exercise/names-faces"
            />
            <ExerciseCard 
              title={t('exercises.numberPeg')}
              desc={t('exercises.numberPegDesc')}
              icon="🔢"
              color="teal"
              route="/exercise/number-peg"
            />
          </div>
        </div>

        {/* 4. ANALYTICS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* A. Streak Card with Heatmap */}
          <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 dark:text-slate-50 text-base sm:text-lg">{t('dashboard.activityStreak')}</h2>
                  <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                    {loading ? t('common.loading') : streak ? (
                      <>{t('dashboard.youreOnStreak')} <span className="text-orange-600 dark:text-orange-400 font-bold">{streak.currentStreak} {t('dashboard.dayStreak')}</span> {t('dashboard.streakExclamation')}</>
                    ) : t('dashboard.startStreakToday')}
                  </div>
                </div>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                 <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">{t('dashboard.longestStreak')}</div>
                 <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{loading ? "..." : streak?.longestStreak || 0} {t('dashboard.days')}</div>
              </div>
            </div>
            
            {/* Activity Heatmap */}
            {!loadingHist && history && <ActivityHeatmap history={history} loading={false} />}
            {loadingHist && <div className="h-16 w-full bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse mt-4" />}
          </div>

          {/* B. Progress & Mastery Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-50 text-base sm:text-lg">{t('dashboard.mastery')}</h2>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{t('dashboard.accuracyOverTime')}</div>
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse h-24 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
            ) : (
              <div className="flex-1 flex flex-col justify-end">
                <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                   <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50">{progress?.totalPoints || 0}</span>
                   <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">Total XP</span>
                </div>
                
                {/* Sparkline Visualization */}
                <div className="h-24 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 relative flex items-end justify-between gap-1 group">
                  {accuracyTrend.length > 0 ? accuracyTrend.map((val, i) => (
                    <div 
                      key={i} 
                      className="relative w-full rounded-t-sm transition-all duration-500 ease-out hover:opacity-80"
                      style={{ 
                        height: `${val}%`,
                        backgroundColor: val > 80 ? '#4F46E5' : val > 50 ? '#818CF8' : '#C7D2FE' 
                      }} 
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-800 dark:bg-slate-700 text-white px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                        {val}%
                      </div>
                    </div>
                  )) : (
                    <div className="w-full text-center text-xs text-slate-400 dark:text-slate-500 self-center">No data yet</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. HISTORY & BADGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
           {/* Recent Sessions */}
           <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 text-base sm:text-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" /> {t('dashboard.recentHistory')}
              </h3>
            </div>
            {loadingHist ? <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
            </div> : recentSessions.length > 0 ? <HistoryList items={recentSessions} /> : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">No recent activity.</div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Badges */}
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-yellow-900/60 flex items-center justify-center text-amber-600 dark:text-yellow-400 shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base sm:text-lg">{t('dashboard.badges')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                   <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ) : progress && progress.badges.length > 0 ? (
                  <>
                  {progress.badges.map(b => <BadgePill key={b} code={b} />)}
                  </>
                ) : (
                  <div className="text-sm text-slate-500 dark:text-slate-400">Complete exercises to earn badges!</div>
                )}
              </div>
            </div>
            
            {/* Adaptive Difficulty Widget */}
            <AdaptiveDifficultyWidget />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ===== Small components/helpers ===== */

// Exercise Card Component
function ExerciseCard({ title, desc, icon, color, route }: { 
  title: string; 
  desc: string; 
  icon: string; 
  color: string; 
  route: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    violet: "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    teal: "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
  };

  return (
    <Link
      to={route}
      className="group relative flex flex-col justify-between p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-900/5 dark:hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[120px] sm:min-h-[140px]"
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-sm ${colors[color]}`}>
          {icon}
        </div>
      </div>
      
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
      </div>
    </Link>
  );
}

// Activity Heatmap Component
function ActivityHeatmap({ history, loading }: { history: HistoryItem[]; loading: boolean }) {
  const { t } = useTranslation();
  const days = useMemo(() => {
    // Create a map of date strings to session counts
    const sessionsByDate = new Map<string, number>();
    
    // Count sessions per day
    history.forEach(session => {
      const sessionDate = new Date(session.startedAt);
      const dateKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;
      sessionsByDate.set(dateKey, (sessionsByDate.get(dateKey) || 0) + 1);
    });
    
    // Generate last 30 days
    const result = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const count = sessionsByDate.get(dateKey) || 0;
      
      let intensity = 0;
      if (count > 0) intensity = 1;
      if (count > 2) intensity = 2;
      if (count > 4) intensity = 3;
      
      result.push({
        dateKey,
        intensity,
        count,
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      });
    }
    
    console.log('Heatmap generated:', result.length, 'days');
    return result;
  }, [history]);

  if (loading) return <div className="h-16 w-full bg-slate-50 dark:bg-slate-800 rounded-lg animate-pulse mt-4" />;

  return (
    <div className="w-full pb-2">
      <div className="flex gap-[1.5px] sm:gap-[2px] w-full">
        {days.map((day, idx) => (
          <div
            key={`${day.dateKey}-${idx}`}
            className="group relative flex-1"
          >
            <div 
              className={`
                w-full h-8 sm:h-10 lg:h-14 rounded-[2px] sm:rounded-sm transition-all duration-300
                ${day.intensity === 0 ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700' : ''}
                ${day.intensity === 1 ? 'bg-indigo-200 dark:bg-indigo-900/50 hover:bg-indigo-300 dark:hover:bg-indigo-800' : ''}
                ${day.intensity === 2 ? 'bg-indigo-400 dark:bg-indigo-700 hover:bg-indigo-500 dark:hover:bg-indigo-600' : ''}
                ${day.intensity === 3 ? 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400' : ''}
              `}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden sm:group-hover:block z-20">
               <div className="bg-slate-800 dark:bg-slate-700 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                  {day.label}: {day.count === 0 ? t('dashboard.noActivityTooltip') : `${day.count} ${day.count === 1 ? t('dashboard.sessionSingular') : t('dashboard.sessionPlural')}`}
               </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-2 sm:mt-3 px-0.5 sm:px-1 font-medium">
        <span>{t('dashboard.daysAgo', { count: 30 })}</span>
        <span>{t('dashboard.today')}</span>
      </div>
    </div>
  );
}

function HistoryList({ items }: { items: HistoryItem[] }) {
  const { t } = useTranslation();
  const getExerciseName = (type: string) => {
    const names: Record<string, string> = {
      WORD_LINKING: t('exercises.wordLinking'),
      NAMES_FACES: t('exercises.namesFaces'),
      NUMBER_PEG: t('exercises.numberPeg'),
      OBJECT_STORY: "Object Story",
      DAILY_CHALLENGE: "Daily Challenge"
    };
    return names[type] || type;
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {items.map((s) => (
        <div key={s.sessionId} className="flex justify-between items-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
             <TypeBadge type={s.type} />
             <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-900 dark:text-slate-50 text-xs sm:text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                {getExerciseName(s.type)}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                {formatDateTime(s.startedAt)}
              </div>
            </div>
          </div>
          
          <div className="text-right shrink-0 ml-2">
             <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-50">
                {s.lastAccuracy ? `${Math.round(s.lastAccuracy * 100)}%` : t('dashboard.notFinished')}
             </div>
             <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t('dashboard.accuracy')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

////



function BadgePill({ code }: { code: string }) {
  const { t } = useTranslation();
  const labels: Record<string, { label: string; emoji: string }> = {
    "FIRST_ATTEMPT": { label: t('dashboard.badgeLabels.FIRST_ATTEMPT'), emoji: "🌱" },
    "STREAK_7": { label: t('dashboard.badgeLabels.STREAK_7'), emoji: "🔥" },
    "STREAK_30": { label: t('dashboard.badgeLabels.STREAK_30'), emoji: "⚡" },
    "MASTER_LINKER": { label: t('dashboard.badgeLabels.MASTER_LINKER'), emoji: "🔗" }
  };
  const badge = labels[code] || { label: code, emoji: "🏅" };
  return (
    <div className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-semibold">
      <span>{badge.emoji}</span>
      <span>{badge.label}</span>
    </div>
  );
}

function TypeBadge({ type }: { type: HistoryItem["type"] }) {
  const { t } = useTranslation();
  const formatType = (exerciseType: string) => {
    const names: Record<string, string> = {
      WORD_LINKING: t('exercises.wordLinking'),
      NAMES_FACES: t('exercises.namesFaces'),
      NUMBER_PEG: t('exercises.numberPeg'),
      OBJECT_STORY: "Object Story",
      DAILY_CHALLENGE: "Daily Challenge"
    };
    return names[exerciseType] || exerciseType.replace("_", " ").toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase());
  };

  return (
    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
      type === "WORD_LINKING" ? "bg-green-500" : "bg-orange-400"
    }`} title={formatType(type)} />
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const diffDays = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const time = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  if (diffDays === 0) return time; // Today - just show time
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${d.toLocaleDateString([], {weekday: 'short'})} ${time}`;
  return `${d.toLocaleDateString([], {month: 'short', day: 'numeric'})} ${time}`;
}