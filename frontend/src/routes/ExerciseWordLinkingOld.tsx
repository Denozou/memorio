import {useState, useEffect} from "react";
import {api} from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, AlertCircle, ArrowRight, Brain } from "lucide-react";
import Timer from "../components/ui/Timer";
import ThemeToggle from "../components/ThemeToggle";

type StartReq = {type: "WORD_LINKING"};
type StartResp = {
    sessionId: string;
    type: "WORD_LINKING";
    payload:{words: string[]};
    skillLevel?: number;
    timingConfig?: {          //timingg from backend
        studySeconds: number;
        itemShowMs: number;
        gapMs: number;
    };
};
type SubmitReq = {
  sessionId: string;
  type: "WORD_LINKING";
  shownWords: string[];
  answers: string[];
};

type SubmitResp = {
  sessionId: string;
  type: "WORD_LINKING";
  total: number;
  correct: number;
  accuracy: number;
  orderCorrect: number;      // add
  orderAccuracy: number;     // add
  correctWords: string[];
  missedWords: string[];
  extraAnswers: string[];
  pointsEarned: number;
  newBadges: string[];
};

export default function ExerciseWordLinking(){
    const nav = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [words, setWords] = useState<string[]|null>(null);
    const [error, setError] = useState<string | null>(null);
    const [skillLevel, setSkillLevel] = useState<number | null>(null);

    const [phase, setPhase] = useState<'idle' | 'study' | 'recall' | 'summary'>('idle');
    const [answers, setAnswers] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState<SubmitResp | null>(null);

    //studySeconds = words ? calculateStudyTime(words.length, skillLevel) : 40;

    const [studySeconds, setStudySeconds] = useState<number>(40);
    const [itemShowMs, setItemShowMs] = useState<number>(1600);
    const [gapMs, setGapMs] = useState<number>(400);

    const [playing, setPlaying] = useState(false);
    const [index, setIndex] = useState(0);   // current word index during study
    const [tick, setTick] = useState<"show" | "gap">("show"); // what we're showing now

    // Effect to handle word transitions
    useEffect(() => {
        let timer: number;

        if (playing && words) {
            if (tick === "show") {
                // Currently showing a word
                timer = setTimeout(() => {
                    setTick("gap");
                }, itemShowMs);
            } else if (tick === "gap") {
                // Currently in gap between words
                timer = setTimeout(() => {
                    if (index < words.length - 1) {
                        // Move to next word
                        setIndex(prevIndex => prevIndex + 1);
                        setTick("show");
                    } else {
                        // All words shown
                        setPlaying(false);
                    }
                }, gapMs);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [playing, tick, index, words, itemShowMs, gapMs]);

    async function startExercise(){
        setError(null);
        setLoading(true);
        try{
            const {data} = await api.post<StartResp>("/exercises/start",{type: "WORD_LINKING"} as StartReq);
            setSessionId(data.sessionId);
            setWords(data.payload.words);
            setAnswers(new Array(data.payload.words.length).fill(""));
            setPhase("study");
            setIndex(0);
            setPlaying(true);
            setSkillLevel(data.skillLevel ?? null);
             if (data.timingConfig) {
                 setStudySeconds(data.timingConfig.studySeconds);
                 setItemShowMs(data.timingConfig.itemShowMs);
                 setGapMs(data.timingConfig.gapMs);
             }
        }catch(err: any){
            setError(err?.response?.data?.error ?? "Failed to start exercise");
        }finally{
            setLoading(false);
        }
    }
    function finishStudy(){
        setPlaying(false);
        setPhase("recall");
    }
    function pct(x: number) {
      return Math.round((x ?? 0) * 100);
    }

    async function handleLogout() {
      try {
        await api.post("/auth/logout");
        nav("/login");
      } catch (e) {
        console.error("Logout failed", e);
        nav("/login");
      }
    }

    function resetExercise() {
      setPhase("idle");
      setSessionId(null);
      setWords(null);
      setScore(null);
      setAnswers([]);
      setIndex(0);
      setPlaying(false);
    }

    function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
      return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-600 dark:text-slate-400">{label}</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">{value}</div>
          {sub && <div className="text-xs text-slate-600 dark:text-slate-400">{sub}</div>}
        </div>
      );
    }

    function ListCard({ title, items, color }: { title: string; items: string[]; color: "green" | "red" | "gray" }) {
      const colorClasses = {
        green: "text-green-600 dark:text-green-400",
        red: "text-red-600 dark:text-red-400",
        gray: "text-slate-600 dark:text-slate-400"
      };

      return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
          <div className="font-bold mb-2 text-sm text-slate-900 dark:text-slate-50">{title}</div>
          {items?.length ? (
            <ul className={`pl-5 m-0 text-sm ${colorClasses[color]}`}>
              {items.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          ) : (
            <div className="text-slate-400 dark:text-slate-500 text-sm">—</div>
          )}
        </div>
      );
    }

    function BadgePill({ code }: { code: string }) {
      const pretty = code.toLowerCase().replace(/_/g, " ").replace(/(^|\s)\S/g, m => m.toUpperCase());
      const emoji = code === "FIRST_ATTEMPT" ? "🌱"
                  : code === "FIRST_PERFECT" ? "🏆"
                  : code.startsWith("STREAK_") ? "🔥"
                  : "🎖️";
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-700 bg-white dark:bg-amber-900/20 text-sm font-semibold text-amber-900 dark:text-amber-100">
          <span aria-hidden>{emoji}</span>
          {pretty}
        </span>
      );
    }
    function DifficultyIndicator({ level, wordCount }: { level: number | null; wordCount: number }) {
      if (!level) return null;

      const getDifficultyColor = (level: number) => {
        if (level <= 3) return "bg-green-500";
        if (level <= 6) return "bg-amber-500";
        return "bg-red-500";
      };

      const getDifficultyLabel = (level: number) => {
        if (level <= 3) return "Easy";
        if (level <= 6) return "Medium";
        return "Hard";
      };

      const colorClass = getDifficultyColor(level);
      const label = getDifficultyLabel(level);

      return (
        <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${colorClass}`} />
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-50">
              Level {level} - {label}
            </span>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {wordCount} words to memorize
          </div>
        </div>
      );
    }
    async function submitRecall() {
      if (!sessionId || !words) return;
      setSubmitting(true);
      setError(null);
      try {
        const body: SubmitReq = {
          sessionId,
          type: "WORD_LINKING",
          shownWords: words,
          answers,
        };
        const { data } = await api.post<SubmitResp>("/exercises/submit", body);
        setScore(data);
        setPhase("summary");
      } catch (e: any) {
        setError(e?.response?.data?.error ?? "Failed to submit answers");
      } finally {
        setSubmitting(false);
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
                <Link to="/dashboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                  Dashboard
                </Link>
                <Link to="/learning" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                  Learning
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
                  <Link to="/dashboard" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/learning" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                    Learning
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
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              🔗 Word Linking
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {phase === "idle" && "Memorize word sequences and recall them in order"}
              {phase === "study" && "Study Phase - Watch and memorize the words"}
              {phase === "recall" && "Recall Phase - Type the words you remember"}
              {phase === "summary" && "Results - See how you did"}
            </p>
            {sessionId && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Session: {sessionId.substring(0, 8)}...
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ===== IDLE PHASE ===== */}
          {phase === "idle" && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-6 sm:p-8 space-y-6">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">How it works</h3>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Words will appear one at a time on screen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Memorize them in the order they appear</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Recall as many words as you can</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Get bonus points for correct order</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={startExercise}
                disabled={loading}
                className="w-full px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Exercise
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ===== STUDY PHASE ===== */}
          {phase === "study" && words && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Memorize these words</span>
                <Timer seconds={studySeconds} onFinish={finishStudy} />
              </div>

              <DifficultyIndicator level={skillLevel} wordCount={words.length} />

              {/* Word display area */}
              <div className="flex flex-col items-center justify-center min-h-[300px] p-8 sm:p-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                {playing && index < words.length && tick === "show" && (
                  <div className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-50 animate-in fade-in duration-300">
                    {words[index]}
                  </div>
                )}
                {playing && tick === "gap" && (
                  <div className="text-3xl text-slate-300 dark:text-slate-600">•••</div>
                )}
                {(!playing || index >= words.length) && (
                  <div className="text-lg text-slate-500 dark:text-slate-400">
                    {index >= words.length ? "All words shown" : "Starting..."}
                  </div>
                )}
              </div>

              {/* Progress indicator */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {index}/{words.length} words shown
                </div>
                <button
                  onClick={finishStudy}
                  className="px-5 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  I'm ready to recall
                </button>
              </div>
            </div>
          )}

          {/* ===== RECALL PHASE ===== */}
          {phase === "recall" && words && (
            <div className="space-y-6">
              <DifficultyIndicator level={skillLevel} wordCount={words.length} />
              
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Type the words you remember. Order matters for bonus points!
              </p>

              {/* Input fields */}
              <div className="space-y-3">
                {answers.map((val, i) => (
                  <input
                    key={i}
                    type="text"
                    value={val}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const copy = answers.slice();
                      copy[i] = e.target.value;
                      setAnswers(copy);
                    }}
                    placeholder={`Word #${i + 1}`}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                ))}
              </div>

              <button
                onClick={submitRecall}
                disabled={submitting}
                className="w-full px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Answers
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ===== SUMMARY PHASE ===== */}
          {phase === "summary" && score && (
            <div className="space-y-6">
              {/* Headline metrics */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Metric
                  label="Unordered accuracy"
                  value={`${score.correct}/${score.total}`}
                  sub={`${pct(score.accuracy)}%`}
                />
                <Metric
                  label="In-order accuracy"
                  value={`${score.orderCorrect}/${score.total}`}
                  sub={`${pct(score.orderAccuracy)}%`}
                />
              </div>

              {/* Points earned */}
              <div className="flex items-center justify-between flex-wrap gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Points earned</div>
                  <div className="text-3xl font-extrabold text-green-600 dark:text-green-400">
                    +{score.pointsEarned}
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  includes bonus for correct order
                </div>
              </div>

              {/* Correct / missed / extra lists */}
              <div className="grid sm:grid-cols-3 gap-4">
                <ListCard title="✓ Correct" items={score.correctWords} color="green" />
                <ListCard title="✗ Missed" items={score.missedWords} color="red" />
                <ListCard title="⚠ Extra answers" items={score.extraAnswers} color="gray" />
              </div>

              {/* New badges */}
              {!!score.newBadges?.length && (
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="font-bold mb-3 text-amber-900 dark:text-amber-100">
                    🎉 New Badges Earned!
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {score.newBadges.map((b) => (
                      <BadgePill key={b} code={b} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/dashboard" className="flex-1">
                  <button className="w-full px-5 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Back to Dashboard
                  </button>
                </Link>
                <button
                  onClick={resetExercise}
                  className="flex-1 px-5 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
}
