import {useState, useEffect} from "react";
import {api} from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, AlertCircle, ArrowRight } from "lucide-react";
import Timer from "../components/ui/Timer";
import ThemeToggle from "../components/ThemeToggle";

type StartReq = {type: "NUMBER_PEG"};
type StartResp = {
    sessionId: string;
    type: "NUMBER_PEG";
    payload:{
        digits: number[];
        hints: string[];
    };
    skillLevel?: number;
    timing?: {
        studySeconds: number;
        itemShowMs: number;
        gapMs: number;
    };
};

type SubmitReq = {
  sessionId: string;
  type: "NUMBER_PEG";
  shownWords: string[];
  answers: string[];
};

type SubmitResp = {
  sessionId: string;
  total: number;
  correct: number;
  accuracy: number;
  orderCorrect: number;
  orderAccuracy: number;
  extraAnswers: string[];
  levelChange?: number;
  newSkillLevel?: number;
  message?: string;
};

export default function ExerciseNumberPeg(){
    const nav = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [digits, setDigits] = useState<number[]|null>(null);
    const [hints, setHints] = useState<string[]|null>(null);
    const [error, setError] = useState<string | null>(null);
    const [skillLevel, setSkillLevel] = useState<number | null>(null);

    const [phase, setPhase] = useState<'idle' | 'study' | 'recall' | 'summary'>('idle');
    const [answers, setAnswers] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState<SubmitResp | null>(null);

    const [studySeconds, setStudySeconds] = useState<number>(30);
    const [itemShowMs, setItemShowMs] = useState<number>(2000);
    const [gapMs, setGapMs] = useState<number>(300);

    const [playing, setPlaying] = useState(false);
    const [index, setIndex] = useState(0);
    const [tick, setTick] = useState<"show" | "gap">("show");
    const [timerRunning, setTimerRunning] = useState(true);

    // Effect to handle digit transitions
    useEffect(() => {
        let timer: number;

        if (playing && digits) {
            console.log('Digit transition:', { index, tick, digitsLength: digits.length, playing });
            if (tick === "show") {
                timer = setTimeout(() => {
                    // After showing a digit, either move to gap or finish
                    if (index >= digits.length - 1) {
                        // Last digit shown, stop playing
                        console.log('Stopping - last digit shown');
                        setPlaying(false);
                        setTimerRunning(false);
                        // After 2 seconds, automatically transition to recall phase
                        setTimeout(() => {
                            setPhase("recall");
                        }, 2000);
                    } else {
                        // More digits to show, go to gap
                        setTick("gap");
                    }
                }, itemShowMs);
            } else if (tick === "gap") {
                timer = setTimeout(() => {
                    // Move to next digit
                    setIndex(prevIndex => prevIndex + 1);
                    setTick("show");
                }, gapMs);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [playing, tick, index, digits, itemShowMs, gapMs]);

    async function startExercise(){
        setError(null);
        setLoading(true);
        try{
            const {data} = await api.post<StartResp>("/exercises/start",{type: "NUMBER_PEG"} as StartReq);
            setSessionId(data.sessionId);
            setDigits(data.payload.digits);
            setHints(data.payload.hints);
            setAnswers(new Array(data.payload.digits.length).fill(""));
            setPhase("study");
            setIndex(0);
            setPlaying(true);
            setTimerRunning(true);
            setSkillLevel(data.skillLevel ?? null);
            if (data.timing) {
                setStudySeconds(data.timing.studySeconds);
                setItemShowMs(data.timing.itemShowMs);
                setGapMs(data.timing.gapMs);
            }
        }catch(err: any){
            setError(err?.response?.data?.error ?? "Failed to start exercise");
        }finally{
            setLoading(false);
        }
    }

    function finishStudy(){
        setPlaying(false);
        setTimerRunning(false);
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
      setDigits(null);
      setHints(null);
      setScore(null);
      setAnswers([]);
      setIndex(0);
      setPlaying(false);
      setTimerRunning(true);
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

    function DifficultyIndicator({ level, digitCount }: { level: number | null; digitCount: number }) {
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
            {digitCount} digits to memorize
          </div>
        </div>
      );
    }

    async function submitRecall() {
      if (!sessionId || !digits) return;
      setSubmitting(true);
      setError(null);
      try {
        // Filter out empty answers to avoid sending more than expected
        const filteredAnswers = answers.filter(a => a.trim() !== "");
        const body: SubmitReq = {
          sessionId,
          type: "NUMBER_PEG",
          shownWords: digits.map(String),
          answers: filteredAnswers,
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
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md" aria-hidden />
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
              🔢 Number Peg Method
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {phase === "idle" && "Use rhyming pegs to memorize number sequences"}
              {phase === "study" && "Study Phase - Associate each digit with its hint word"}
              {phase === "recall" && "Recall Phase - Type the digits you remember"}
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
              <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">How it works</h3>
                <ul className="space-y-2 text-purple-800 dark:text-purple-200">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                    <span>Each digit (0-9) has a rhyming hint word</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                    <span>Digits will appear one at a time with their hints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                    <span>Create mental images linking the hints together</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                    <span>Recall the sequence in the correct order</span>
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
          {phase === "study" && digits && hints && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">Memorize these digits</span>
                <Timer seconds={studySeconds} onFinish={finishStudy} running={timerRunning} />
              </div>

              <DifficultyIndicator level={skillLevel} digitCount={digits.length} />

              {/* Digit + Hint display area */}
              <div className="flex flex-col items-center justify-center min-h-[300px] p-8 sm:p-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                {(() => {
                  console.log('Render state:', { playing, tick, index });
                  if (playing && tick === "show") {
                    return (
                      <div className="text-center animate-in fade-in duration-300">
                        <div className="text-6xl sm:text-7xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                          {digits[index]}
                        </div>
                        <div className="text-2xl sm:text-3xl font-semibold text-slate-700 dark:text-slate-300">
                          {hints[index]}
                        </div>
                      </div>
                    );
                  } else if (playing && tick === "gap") {
                    return <div className="text-3xl text-slate-300 dark:text-slate-600">•••</div>;
                  } else if (!playing) {
                    return (
                      <div className="text-lg text-slate-500 dark:text-slate-400">
                        All digits shown
                      </div>
                    );
                  } else {
                    console.warn('Unhandled state!', { playing, tick, index });
                    return <div className="text-lg text-slate-500 dark:text-slate-400">Loading...</div>;
                  }
                })()}
              </div>

              {/* Progress indicator */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {playing && index < digits.length ? `${index + 1}/${digits.length}` : `${digits.length}/${digits.length}`} digits shown
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
          {phase === "recall" && digits && (
            <div className="space-y-6">
              <DifficultyIndicator level={skillLevel} digitCount={digits.length} />
              
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Type the digits you remember in the correct order.
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
                    placeholder={`Digit #${i + 1}`}
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
          {phase === "summary" && score && digits && (
            <div className="space-y-6">
              {/* Headline metrics */}
              <div className="grid sm:grid-cols-2 gap-4">
                <Metric
                  label="Correct digits"
                  value={`${score.correct}/${score.total}`}
                  sub={`${pct(score.accuracy)}%`}
                />
                <Metric
                  label="In correct order"
                  value={`${score.orderCorrect}/${score.total}`}
                  sub={`${pct(score.orderAccuracy)}%`}
                />
              </div>

              {/* Level change message */}
              {score.message && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {score.message}
                  </div>
                  {score.levelChange !== undefined && score.levelChange !== 0 && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Level {score.levelChange > 0 ? "increased" : "decreased"} to {score.newSkillLevel}
                    </div>
                  )}
                </div>
              )}

              {/* Show the sequence */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900">
                <div className="font-bold mb-2 text-sm text-slate-900 dark:text-slate-50">The sequence was:</div>
                <div className="text-2xl font-mono text-slate-700 dark:text-slate-300">
                  {digits.join(" ")}
                </div>
              </div>

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
