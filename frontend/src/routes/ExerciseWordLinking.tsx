import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, Link as LinkIcon, AlertCircle, CheckCircle2, 
  RotateCcw, Trophy, Brain, LogOut, Menu, X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import ReviewNotificationBadge from "../components/ReviewNotificationBadge";
import LanguageSelector from "../components/LanguageSelector";

type StartReq = { type: "WORD_LINKING" };

type StartResp = {
  sessionId: string;
  type: "WORD_LINKING";
  payload: { words: string[] };
  skillLevel?: number;
  timingConfig?: {
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
  orderCorrect: number;
  orderAccuracy: number;
  correctWords: string[];
  missedWords: string[];
  extraAnswers: string[];
  pointsEarned: number;
  newBadges: string[];
  skillLevel?: number;
};

export default function ExerciseWordLinking() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [words, setWords] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<number | null>(null);

  const [phase, setPhase] = useState<"idle" | "study" | "recall" | "summary">("idle");
  const [userList, setUserList] = useState<string[]>([]); // Raw user input (in order typed)
  const [positionedAnswers, setPositionedAnswers] = useState<string[]>([]); // Matched to target positions

  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<SubmitResp | null>(null);

  const [studySeconds, setStudySeconds] = useState<number>(40);
  const [itemShowMs, setItemShowMs] = useState<number>(1600);
  const [gapMs, setGapMs] = useState<number>(400);

  async function startExercise() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<StartResp>("/exercises/start", { type: "WORD_LINKING" } as StartReq);
      setSessionId(data.sessionId);
      setWords(data.payload.words);
      setSkillLevel(data.skillLevel ?? null);
      
      if (data.timingConfig) {
        setStudySeconds(data.timingConfig.studySeconds);
        setItemShowMs(data.timingConfig.itemShowMs);
        setGapMs(data.timingConfig.gapMs);
      }
      setPhase("study");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to start exercise");
    } finally {
      setLoading(false);
    }
  }

  async function submitRecall(userAnswers: string[]) {
    if (!sessionId || !words) return;
    setSubmitting(true);
    setError(null);
    try {
      // Match user answers to correct positions in the target list
      const positionedAnswers = words.map(targetWord => {
        // Find if user entered this word (case-insensitive)
        const userAnswer = userAnswers.find(
          userWord => userWord.toLowerCase().trim() === targetWord.toLowerCase().trim()
        );
        return userAnswer || "";
      });

      const body: SubmitReq = {
        sessionId,
        type: "WORD_LINKING",
        shownWords: words,
        answers: positionedAnswers,
      };
      const { data } = await api.post<SubmitResp>("/exercises/submit", body);
      setScore(data);
      setPositionedAnswers(positionedAnswers); // Store for display
      setPhase("summary");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to submit answers");
    } finally {
      setSubmitting(false);
    }
  }

  function resetExercise() {
    setPhase("idle");
    setSessionId(null);
    setWords(null);
    setScore(null);
    setUserList([]);
    setPositionedAnswers([]);
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
              <Link to="/dashboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 inline-flex items-center">
                Dashboard
                <ReviewNotificationBadge />
              </Link>
              <Link to="/leaderboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                Leaderboard
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

          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                <Link to="/dashboard" className="py-2 text-slate-600 dark:text-slate-300 inline-flex items-center" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                  <ReviewNotificationBadge />
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
                  <LogOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
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
          {phase === "study" && words && (
            <StudyPhase 
              words={words}
              itemShowMs={itemShowMs}
              gapMs={gapMs}
              onComplete={() => setPhase("recall")} 
            />
          )}
          {phase === "recall" && words && (
            <RecallPhase 
              wordCount={words.length}
              onComplete={(list) => { 
                setUserList(list); 
                submitRecall(list);
              }} 
            />
          )}
          {phase === "summary" && score && words && (
            <ResultsPhase 
              targetList={words} 
              userList={positionedAnswers} 
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
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 sm:p-6 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-3">{t('exercises.howItWorks')}</h3>
          <ul className="space-y-2 text-sm sm:text-base text-indigo-800 dark:text-indigo-200">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
              <span>{t('exercises.wordLinkingInstructions.step1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
              <span>{t('exercises.wordLinkingInstructions.step2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
              <span>{t('exercises.wordLinkingInstructions.step3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
              <span>{t('exercises.wordLinkingInstructions.step4')}</span>
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
              {t('common.loading')}
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

function StudyPhase({ words, itemShowMs, gapMs, onComplete }: { 
  words: string[]; 
  itemShowMs: number;
  gapMs: number;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [tick, setTick] = useState<"show" | "gap">("show");

  // Auto-advance timer logic
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setTimeout(() => {
      if (tick === "show") {
        setTick("gap");
      } else {
        if (index < words.length - 1) {
          setIndex(prev => prev + 1);
          setTick("show");
        } else {
          setIsAutoPlaying(false);
          // Auto-transition to recall after showing all words
          setTimeout(() => {
            onComplete();
          }, 1500);
        }
      }
    }, tick === "show" ? itemShowMs : gapMs);

    return () => clearTimeout(timer);
  }, [index, tick, isAutoPlaying, words.length, itemShowMs, gapMs, onComplete]);

  const currentWord = words[index];
  const previousWord = index > 0 ? words[index - 1] : null;

  return (
    <div className="flex flex-col items-center animate-in fade-in duration-500">
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-8 sm:mb-12 overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-linear"
          style={{ width: `${((index + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* The "Chain" Visualizer */}
      <div className="relative flex items-center justify-center min-h-[200px] sm:min-h-[256px] w-full px-4">
        
        {tick === "show" && (
          <>
            {/* Previous Word (Faded) - Anchors the memory */}
            {previousWord && (
              <div className="absolute left-0 sm:left-10 opacity-30 scale-75 blur-[1px] transition-all duration-500 transform -translate-x-4 sm:-translate-x-12 hidden sm:block">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-400 dark:text-slate-600">
                  {previousWord}
                </div>
              </div>
            )}

            {/* Connection Line */}
            {previousWord && (
              <div className="absolute left-1/4 w-1/4 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-indigo-500 hidden sm:block" />
            )}

            {/* Current Word (Hero) */}
            <div className="z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl text-center min-w-[280px] sm:min-w-[300px] transform transition-all duration-300">
              <div className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mb-2">
                Word #{index + 1}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                {currentWord}
              </h1>
            </div>

            {/* Link Icon Overlay */}
            {previousWord && (
              <div className="absolute left-[25%] z-20 bg-white dark:bg-slate-950 p-2 rounded-full border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xl hidden sm:block">
                <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
          </>
        )}

        {tick === "gap" && (
          <div className="text-3xl text-slate-300 dark:text-slate-600 animate-pulse">•••</div>
        )}
      </div>

      <div className="mt-8 sm:mt-12 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
        {tick === "show" ? "Visualizing link..." : "Next word..."}
      </div>
    </div>
  );
}

function RecallPhase({ wordCount, onComplete }: { 
  wordCount: number;
  onComplete: (list: string[]) => void;
}) {
  const [inputs, setInputs] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;
    setInputs([...inputs, currentInput.trim()]);
    setCurrentInput("");
  };

  const handleFinish = () => {
    const final = currentInput.trim() ? [...inputs, currentInput.trim()] : inputs;
    onComplete(final);
  };

  const removeWord = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden">
        
        {/* The List So Far (Scrollable history) */}
        <div className="max-h-64 sm:max-h-80 overflow-y-auto p-3 sm:p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {inputs.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8 italic text-sm">
              Your chain is empty. Start typing below!
            </div>
          )}
          {inputs.map((word, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3 text-slate-700 dark:text-slate-300 animate-in fade-in slide-in-from-top-2">
              <span className="font-mono text-xs opacity-50 w-6 text-right shrink-0">{i + 1}.</span>
              <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800/50 text-sm sm:text-base">
                {word}
              </div>
              <button
                onClick={() => removeWord(i)}
                className="shrink-0 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 dark:text-red-400"
                aria-label="Remove word"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
        </div>

        {/* Active Input Area */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30">
          <form onSubmit={handleSubmit} className="relative">
            <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-mono text-xs sm:text-sm">
              #{inputs.length + 1}
            </span>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Type next word & hit Enter..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl py-3 sm:py-4 pl-10 sm:pl-12 pr-16 sm:pr-20 text-base sm:text-lg text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-400"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-4 rounded-lg font-medium transition-colors text-sm"
            >
              Add
            </button>
          </form>
          
          <div className="flex justify-between items-center mt-3 sm:mt-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {inputs.length} / {wordCount} words recalled
            </div>
            <button 
              onClick={handleFinish}
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 flex items-center gap-1 font-medium"
            >
              Finish Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsPhase({ targetList, userList, score, onReset }: { 
  targetList: string[];
  userList: string[];
  score: SubmitResp;
  onReset: () => void;
}) {
  const accuracy = Math.round(score.accuracy * 100);
  const orderAccuracy = Math.round(score.orderAccuracy * 100);

  return (
    <div className="animate-in zoom-in-95 duration-500 space-y-6 sm:space-y-8">
      
      {/* Score Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Session Complete</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          {accuracy}% Chain Integrity
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          You recalled {score.correct} out of {targetList.length} words correctly.
        </p>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-1">
          Order accuracy: {orderAccuracy}% • Points: <span className="text-green-600 dark:text-green-400 font-bold">+{score.pointsEarned}</span>
        </p>
      </div>

      {/* The Broken Chain Visualizer */}
      <div className="relative max-w-2xl mx-auto space-y-0">
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />

        {targetList.map((target, i) => {
          const userWord = userList[i] || "";
          const isCorrect = userWord.toLowerCase() === target.toLowerCase();
          const isSkipped = !userWord || userWord.trim() === "";

          return (
            <div key={i} className="flex gap-3 sm:gap-6 relative pb-6 sm:pb-8 last:pb-0">
              {/* Timeline Node */}
              <div className={`
                flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center border-4 z-10 bg-white dark:bg-slate-950
                ${isCorrect 
                  ? "border-green-500/20 text-green-600 dark:text-green-400" 
                  : "border-red-500/20 text-red-600 dark:text-red-400"
                }
              `}>
                <span className="font-bold text-sm sm:text-lg">#{i + 1}</span>
              </div>

              {/* Card Content */}
              <div className={`
                flex-1 rounded-xl sm:rounded-2xl border p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4
                ${isCorrect 
                  ? "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800" 
                  : "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30"
                }
              `}>
                <div className="min-w-0 flex-1">
                  <div 
                    className={isCorrect 
                      ? "text-[10px] sm:text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400" 
                      : "text-[10px] sm:text-xs font-bold uppercase mb-1"
                    }
                    style={!isCorrect ? { color: '#334155' } : undefined}>
                    Target Word
                  </div>
                  <div 
                    className={isCorrect 
                      ? "text-base sm:text-lg font-medium truncate text-slate-900 dark:text-slate-50" 
                      : "text-base sm:text-lg font-medium truncate"
                    }
                    style={!isCorrect ? { color: '#0f172a' } : undefined}>
                    {target}
                  </div>
                </div>

                {!isCorrect && (
                  <div className="text-left sm:text-right min-w-0">
                    <div className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-bold uppercase mb-1">
                      You Said
                    </div>
                    <div className="text-sm sm:text-xs font-medium text-red-700 dark:text-red-300 decoration-red-500/50 truncate">
                      {isSkipped ? "(Skipped)" : userWord}
                    </div>
                  </div>
                )}

                <div className="shrink-0">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500/50" />
                  ) : (
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500/50" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Badges */}
      {!!score.newBadges?.length && (
        <div className="p-4 sm:p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="font-bold mb-3 text-amber-900 dark:text-amber-100 text-sm sm:text-base">
            🎉 New Badge Earned!
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {score.newBadges.map((b) => (
              <BadgePill key={b} code={b} />
            ))}
          </div>
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
        <div className="p-2 sm:p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
          <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Word Linking
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 capitalize truncate">
            {phase === "idle" && "Memory Chain Challenge"}
            {phase === "study" && "Phase 1: Visualization"}
            {phase === "recall" && "Phase 2: Chain Construction"}
            {phase === "summary" && "Phase 3: Analysis"}
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

function BadgePill({ code }: { code: string }) {
  const pretty = code.toLowerCase().replace(/_/g, " ").replace(/(^|\s)\S/g, m => m.toUpperCase());
  const emoji = code === "FIRST_ATTEMPT" ? "🌱"
              : code === "FIRST_PERFECT" ? "🏆"
              : code.startsWith("STREAK_") ? "🔥"
              : "🎖️";
  return (
    <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-200 border border-amber-100 dark:border-amber-800/50">
      <span>{emoji}</span> {pretty}
    </span>
  );
}
