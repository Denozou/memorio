import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { Flame, TrendingUp, Award, Clock, LogOut, Menu, X } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

/* ===== Types ===== */
type Streak = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // ISO date (YYYY-MM-DD) or null
  timezone: string;
};

type HistoryItem = {
  sessionId: string;
  type: "WORD_LINKING" | "NAMES_FACES" | "OBJECT_STORY" | "DAILY_CHALLENGE";
  startedAt: string;        // ISO datetime
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
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ===== Streak state ===== */
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [streakErr, setStreakErr] = useState<string | null>(null);

  /* ===== History state ===== */
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [histErr, setHistErr] = useState<string | null>(null);

  const [progress, setProgress] = useState<Progress | null>(null);
  const [loadingProg, setLoadingProg] = useState(false);
  const [progErr, setProgErr] = useState<string | null>(null);

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

    // Load history (latest 5)
    (async () => {
      setLoadingHist(true);
      setHistErr(null);
      try {
        const { data } = await api.get<HistoryResponse>("/exercises/history", {
          params: { limit: 5, offset: 0 },
        });
        if (alive) setHistory(data.items);
      } catch (e: any) {
        if (alive) setHistErr(e?.response?.data?.error ?? "Failed to load history");
      } finally {
        if (alive) setLoadingHist(false);
      }
    })();

    // Load progress (points & badges)
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
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md" aria-hidden />
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">Memorio</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm text-slate-900 dark:text-slate-50 font-medium">
                Dashboard
              </Link>
              <Link to="/profile" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                Profile
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-slate-300/70 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className="p-2 rounded-lg border border-slate-300/70 dark:border-slate-700"
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
                  Dashboard
                </Link>
                <Link to="/profile" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="py-2 text-left text-slate-600 dark:text-slate-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Dashboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Track your progress and continue learning
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link
            to="/exercise/word-linking"
            className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white text-xl">
                🔗
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Word Linking
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Memorize and recall word sequences</p>
              </div>
            </div>
          </Link>

          <Link
            to="/exercise/names-faces"
            className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-600 dark:bg-violet-500 flex items-center justify-center text-white text-xl">
                👤
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Names & Faces
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Remember people's names</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Streak Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">Streak</h2>
            </div>
            {loadingStreak && <div className="text-sm text-slate-500">Loading...</div>}
            {streakErr && <div className="text-sm text-red-600 dark:text-red-400">{streakErr}</div>}
            {streak && (
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                  {streak.currentStreak}
                  <span className="text-lg font-normal text-slate-500 dark:text-slate-400 ml-2">
                    {streak.currentStreak === 1 ? "day" : "days"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Longest: <span className="font-semibold">{streak.longestStreak}</span> days
                </div>
              </div>
            )}
          </div>

          {/* Progress Card */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">Progress</h2>
            </div>
            {loadingProg && <div className="text-sm text-slate-500">Loading...</div>}
            {progErr && <div className="text-sm text-red-600 dark:text-red-400">{progErr}</div>}
            {progress && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                    {progress.totalPoints}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Points</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                    {progress.totalAttempts}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Attempts</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                    {progress.totalCorrect}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Correct</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Badges Section */}
        {progress && progress.badges.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">Badges</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {progress.badges.map((badge) => (
                <BadgePill key={badge} code={badge} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Recent Sessions</h2>
          </div>
          {loadingHist && <div className="text-sm text-slate-500">Loading...</div>}
          {histErr && <div className="text-sm text-red-600 dark:text-red-400">{histErr}</div>}
          {history && history.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No sessions yet. Start an exercise above!
            </div>
          )}
          {history && history.length > 0 && <HistoryList items={history} />}
        </div>
      </main>
    </div>
  );
}

/* ===== Small components/helpers ===== */


function HistoryList({ items }: { items: HistoryItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((s) => (
        <div
          key={s.sessionId}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TypeBadge type={s.type} />
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-50">
                {scoreText(s.lastCorrect, s.lastTotal, s.lastAccuracy)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {formatDateTime(s.startedAt)}
              </div>
            </div>
          </div>
          <Link
            to={s.type === "WORD_LINKING" ? "/exercise/word-linking" : "/exercise/names-faces"}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Try again →
          </Link>
        </div>
      ))}
    </div>
  );
}

////



function BadgePill({ code }: { code: string }) {
  const pretty = code
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());

  const emoji = badgeEmoji(code);

  return (
    <span
      title={pretty}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-sm font-semibold text-amber-900 dark:text-amber-100"
    >
      <span aria-hidden>{emoji}</span>
      {pretty}
    </span>
  );
}

function badgeEmoji(code: string) {
  switch (code) {
    case "FIRST_ATTEMPT": return "🌱";
    case "FIRST_PERFECT": return "🏆";
    case "STREAK_7": return "🔥";
    default: return "🎖️";
  }
}



function TypeBadge({ type }: { type: HistoryItem["type"] }) {
  const label = type
    .replace("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
  return (
    <span className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
      {label}
    </span>
  );
}

function scoreText(correct: number | null, total: number | null, acc: number | null) {
  if (correct == null || total == null || acc == null) return "—";
  const pct = Math.round(acc * 100);
  return `${correct}/${total} (${pct}%)`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}