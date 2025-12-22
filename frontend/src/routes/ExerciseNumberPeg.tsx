import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, Hash, CheckCircle2, AlertCircle, RotateCcw, 
  Trophy, Brain, Delete, Play, Pause, LogOut, Menu, X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

type StartReq = { type: "NUMBER_PEG" };

type StartResp = {
  sessionId: string;
  type: "NUMBER_PEG";
  payload: {
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

export default function ExerciseNumberPeg() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [digits, setDigits] = useState<number[] | null>(null);
  const [hints, setHints] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<number | null>(null);

  const [phase, setPhase] = useState<"idle" | "study" | "recall" | "summary">("idle");
  const [userSequence, setUserSequence] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<SubmitResp | null>(null);

  const [itemShowMs, setItemShowMs] = useState<number>(2000);
  const [gapMs, setGapMs] = useState<number>(300);

  async function startExercise() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<StartResp>("/exercises/start", { type: "NUMBER_PEG" } as StartReq);
      setSessionId(data.sessionId);
      setDigits(data.payload.digits);
      setHints(data.payload.hints);
      setSkillLevel(data.skillLevel ?? null);
      
      if (data.timing) {
        setItemShowMs(data.timing.itemShowMs);
        setGapMs(data.timing.gapMs);
      }
      setPhase("study");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function submitRecall(sequence: string) {
    if (!sessionId || !digits) return;
    setSubmitting(true);
    setError(null);
    try {
      const answers = sequence.split("");
      const body: SubmitReq = {
        sessionId,
        type: "NUMBER_PEG",
        shownWords: digits.map(String),
        answers,
      };
      const { data } = await api.post<SubmitResp>("/exercises/submit", body);
      setScore(data);
      setPhase("summary");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  function resetExercise() {
    setPhase("idle");
    setSessionId(null);
    setDigits(null);
    setHints(null);
    setScore(null);
    setUserSequence("");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50 text-sm sm:text-base">Memorio</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.dashboard')}
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
              <LanguageSelector variant="compact" />
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-slate-300/70 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('common.logout')}
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <LanguageSelector variant="compact" />
              <ThemeToggle />
              <button
                className="p-2 rounded-lg border border-slate-300/70 dark:border-slate-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? t('exercises.closeMenu') : t('exercises.openMenu')}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                <Link to="/dashboard" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.dashboard')}
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
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <Header phase={phase} sessionId={sessionId} skillLevel={skillLevel} />

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 sm:mt-8">
          {phase === "idle" && <IdleView loading={loading} onStart={startExercise} t={t} />}
          {phase === "study" && digits && hints && (
            <StudyPhase 
              digits={digits}
              hints={hints}
              itemShowMs={itemShowMs}
              gapMs={gapMs}
              onComplete={() => setPhase("recall")} 
            />
          )}
          {phase === "recall" && digits && (
            <RecallPhase 
              digitCount={digits.length}
              onComplete={(seq) => { 
                setUserSequence(seq); 
                submitRecall(seq);
              }} 
            />
          )}
          {phase === "summary" && score && digits && hints && (
            <ResultsPhase 
              targetDigits={digits}
              targetHints={hints}
              userSequence={userSequence} 
              score={score}
              onReset={resetExercise}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ===== PHASE COMPONENTS ===== */

function IdleView({ loading, onStart, t }: { loading: boolean; onStart: () => void; t: any }) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 sm:p-6 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">{t('exercises.howItWorks')}</h3>
          <ul className="space-y-2 text-sm sm:text-base text-purple-800 dark:text-purple-200">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>{t('exercises.numberPegInstructions.step1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>{t('exercises.numberPegInstructions.step2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>{t('exercises.numberPegInstructions.step3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>{t('exercises.numberPegInstructions.step4')}</span>
            </li>
          </ul>
        </div>
        <button
          onClick={onStart}
          disabled={loading}
          className="w-full px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('exercises.starting')}
            </>
          ) : (
            <>
              {t('exercises.startExercise')}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StudyPhase({ digits, hints, itemShowMs, gapMs, onComplete }: { 
  digits: number[];
  hints: string[];
  itemShowMs: number;
  gapMs: number;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [tick, setTick] = useState<"show" | "gap">("show");

  // Auto-advance logic
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setTimeout(() => {
      if (tick === "show") {
        // After showing a digit, check if it's the last one
        if (index >= digits.length - 1) {
          // Last digit shown, stop and transition to recall
          setIsAutoPlaying(false);
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          // More digits to show, go to gap
          setTick("gap");
        }
      } else {
        // In gap phase, move to next digit
        setIndex(prev => prev + 1);
        setTick("show");
      }
    }, tick === "show" ? itemShowMs : gapMs);

    return () => clearTimeout(timer);
  }, [index, tick, isAutoPlaying, digits.length, itemShowMs, gapMs, onComplete]);

  const currentItem = { digit: digits[index], peg: hints[index] };
  const progress = ((index + 1) / digits.length) * 100;

  return (
    <div className="flex flex-col items-center animate-in fade-in duration-500">
      
      {/* Sequence Progress */}
      <div className="w-full flex justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 font-mono">
        <span>Digit {index + 1} of {digits.length}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-8 sm:mb-12 overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* The Study Card */}
      {tick === "show" && (
        <div className="relative group w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 rounded-2xl sm:rounded-3xl shadow-xl text-center relative overflow-hidden">
            
            {/* Background Number Faded */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] sm:text-[200px] font-black text-slate-200/30 dark:text-slate-800/10 select-none pointer-events-none">
              {currentItem.digit}
            </div>

            <div className="relative z-10 space-y-4 sm:space-y-6">
              <div className="inline-block p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg">
                <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">
                  {currentItem.digit}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  Peg Word
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-700 dark:text-slate-50">
                  {currentItem.peg}
                </h2>
              </div>
            </div>
          </div>
          
          {/* Controls Overlay */}
          <div className="absolute -bottom-14 sm:-bottom-16 left-0 right-0 flex justify-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="p-2 sm:p-3 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-lg"
              aria-label={isAutoPlaying ? "Pause" : "Play"}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            {!isAutoPlaying && (
              <button 
                onClick={() => {
                  if (index < digits.length - 1) {
                    setIndex(index + 1);
                    setTick("show");
                  }
                }}
                disabled={index >= digits.length - 1}
                className="p-2 sm:p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next"
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {tick === "gap" && (
        <div className="text-3xl text-slate-300 dark:text-slate-600 animate-pulse h-64 flex items-center">•••</div>
      )}
    </div>
  );
}

function RecallPhase({ digitCount, onComplete }: { 
  digitCount: number;
  onComplete: (seq: string) => void;
}) {
  const [input, setInput] = useState("");
  
  const handleNumClick = (num: number) => {
    if (input.length < digitCount) {
      setInput(prev => prev + num.toString());
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (input.length > 0) {
      onComplete(input);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (input.length < digitCount) setInput(prev => prev + e.key);
      }
      if (e.key === 'Backspace') handleDelete();
      if (e.key === 'Enter' && input.length > 0) handleSubmit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Display Screen */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-center shadow-inner relative">
        <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono mb-2 uppercase">Sequence Output</div>
        <div className="min-h-[48px] sm:min-h-[64px] flex items-center justify-center gap-0.5 sm:gap-1 overflow-x-auto pb-2">
          {/* Render placeholders for total length */}
          {Array.from({ length: digitCount }).map((_, i) => (
            <div 
              key={i} 
              className={`
                w-7 h-10 sm:w-8 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-mono font-bold transition-all shrink-0
                ${input[i] ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50" : "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed text-slate-300 dark:text-slate-700"}
                ${i === input.length ? "border-blue-500/50 bg-blue-500/10 animate-pulse" : ""}
              `}
            >
              {input[i] || ""}
            </div>
          ))}
        </div>
        
        {/* Progress Indicator */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 text-xs font-bold text-slate-400 dark:text-slate-600">
          {input.length}/{digitCount}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumClick(num)}
            className="h-14 sm:h-16 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-blue-600 dark:active:bg-blue-600 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-200 transition-all shadow-md active:scale-95"
          >
            {num}
          </button>
        ))}
        <button 
          onClick={handleDelete}
          className="h-14 sm:h-16 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors shadow-md"
          aria-label="Delete"
        >
          <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={() => handleNumClick(0)}
          className="h-14 sm:h-16 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-blue-600 dark:active:bg-blue-600 text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-200 transition-all shadow-md active:scale-95"
        >
          0
        </button>
        <button 
          onClick={handleSubmit}
          disabled={input.length === 0}
          className="h-14 sm:h-16 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-md"
          aria-label="Submit"
        >
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
      
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Tip: You can use your keyboard numbers
      </p>
    </div>
  );
}

function ResultsPhase({ targetDigits, targetHints, userSequence, score, onReset }: { 
  targetDigits: number[];
  targetHints: string[];
  userSequence: string;
  score: SubmitResp;
  onReset: () => void;
}) {
  // Diff logic
  const results = targetDigits.map((digit, i) => {
    const userDigit = userSequence[i];
    const isCorrect = userDigit === digit.toString();
    return { digit, peg: targetHints[i], userDigit, isCorrect };
  });

  const accuracy = Math.round(score.accuracy * 100);

  return (
    <div className="animate-in zoom-in-95 duration-500 max-w-lg mx-auto space-y-6 sm:space-y-8">
      
      {/* Score Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Analysis Complete</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          {accuracy}% Accuracy
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          You recalled {score.correct} out of {targetDigits.length} digits correctly.
        </p>
        {score.orderCorrect !== undefined && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1">
            In correct order: {score.orderCorrect}/{targetDigits.length}
          </p>
        )}
      </div>

      {/* The Sequence Diff Visualization */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-6 sm:gap-y-8 gap-x-2">
          {results.map((r, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group relative">
              
              {/* User Input Bubble */}
              <div className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-base sm:text-lg border-2 z-10
                ${r.isCorrect 
                  ? "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400" 
                  : "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400"}
              `}>
                {r.userDigit || "?"}
              </div>

              {/* Connector Line */}
              <div className={`h-3 sm:h-4 w-0.5 ${r.isCorrect ? "bg-slate-300 dark:bg-slate-700" : "bg-red-500/30"}`} />

              {/* Target Digit (The Correct Answer) */}
              <div className={`
                text-xs sm:text-sm font-mono font-bold
                ${r.isCorrect ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300 underline decoration-blue-500/50 decoration-2 underline-offset-4"}
              `}>
                {r.digit}
              </div>

              {/* Hover Tooltip for Peg */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-800 dark:bg-slate-700 text-[10px] sm:text-xs px-2 py-1 rounded text-white whitespace-nowrap z-20 shadow-lg">
                {r.peg}
              </div>
            </div>
          ))}
        </div>
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
        <button 
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
        <Link to="/dashboard">
          <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors text-sm sm:text-base w-full sm:w-auto">
            Back to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ===== HELPER COMPONENTS ===== */

function Header({ phase, sessionId, skillLevel }: { 
  phase: string; 
  sessionId: string | null;
  skillLevel: number | null;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2 sm:p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
          <Hash className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Number Pegs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 capitalize truncate">
            {phase === "idle" && "Memory Peg System"}
            {phase === "study" && "Phase 1: Association"}
            {phase === "recall" && "Phase 2: Sequence Entry"}
            {phase === "summary" && "Phase 3: Accuracy Check"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        {skillLevel && <DifficultyBadge level={skillLevel} />}
        {sessionId && (
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 sm:px-3 py-1 rounded-lg">
            <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Session: {sessionId.substring(0, 8)}...</span>
            <span className="sm:hidden">{sessionId.substring(0, 6)}...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DifficultyBadge({ level }: { level: number }) {
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
    <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span className="font-semibold text-[10px] sm:text-xs text-slate-900 dark:text-slate-50">
        Level {level} - {label}
      </span>
    </div>
  );
}
