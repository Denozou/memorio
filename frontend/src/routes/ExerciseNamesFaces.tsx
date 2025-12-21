import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { 
  LogOut, Menu, X, AlertCircle, ArrowRight, Brain, 
  Trophy, Check, RotateCcw, Target
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

type FaceData = {
  personName: string;
  displayName: string;
  imageUrl: string;
};

type StartReq = { type: "NAMES_FACES" };

type StartResp = {
  sessionId: string;
  type: "NAMES_FACES";
  payload: { faces: FaceData[] };
  skillLevel?: number;
  timingConfig?: {
    studySeconds: number;
    itemShowMs: number;
    gapMs: number;
  };
};

type SubmitReq = {
  sessionId: string;
  type: "NAMES_FACES";
  shownWords: string[];
  answers: string[];
};

type SubmitResp = {
  sessionId: string;
  type: "NAMES_FACES";
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

export default function ExerciseNamesFaces() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [faces, setFaces] = useState<FaceData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<number | null>(null);

  const [phase, setPhase] = useState<"idle" | "study" | "recall" | "summary">("idle");
  const [answers, setAnswers] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<SubmitResp | null>(null);

  // Study phase state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingFace, setShowingFace] = useState(true);

  const [studySeconds, setStudySeconds] = useState<number>(40);
  const [itemShowMs, setItemShowMs] = useState<number>(1600);
  const [gapMs, setGapMs] = useState<number>(400);
  
  // Timer state for per-face countdown
  const [timeLeft, setTimeLeft] = useState(0);

  // Initialize timer when showing a new face
  useEffect(() => {
    if (phase === "study" && showingFace) {
      setTimeLeft(itemShowMs);
    }
  }, [currentIndex, showingFace, phase, itemShowMs]);

  // Per-face countdown timer
  useEffect(() => {
    if (phase !== "study" || !showingFace || !faces) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, showingFace, faces]);

  // Face transition logic
  useEffect(() => {
    if (phase !== "study" || !faces) return;

    const timer = setTimeout(() => {
      if (showingFace) {
        setShowingFace(false);
      } else {
        if (currentIndex < faces.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setShowingFace(true);
        } else {
          // All faces shown, auto-transition to recall after a short delay
          setTimeout(() => {
            setPhase("recall");
          }, 1500);
        }
      }
    }, showingFace ? itemShowMs : gapMs);

    return () => clearTimeout(timer);
  }, [phase, faces, currentIndex, showingFace, itemShowMs, gapMs]);

  async function startExercise() {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<StartResp>("/exercises/start", { type: "NAMES_FACES" } as StartReq);
      setSessionId(data.sessionId);
      setFaces(data.payload.faces);
      setAnswers(new Array(data.payload.faces.length).fill(""));
      setSkillLevel(data.skillLevel ?? null);

      if (data.timingConfig) {
        setStudySeconds(data.timingConfig.studySeconds);
        setItemShowMs(data.timingConfig.itemShowMs);
        setGapMs(data.timingConfig.gapMs);
      }
      setPhase("study");
      setCurrentIndex(0);
      setShowingFace(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  function finishStudy() {
    setPhase("recall");
  }

  async function submitRecall() {
    if (!sessionId || !faces) return;
    setSubmitting(true);
    setError(null);
    try {
      const body: SubmitReq = {
        sessionId,
        type: "NAMES_FACES",
        shownWords: faces.map(f => f.displayName),
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

  function resetExercise() {
    setPhase("idle");
    setSessionId(null);
    setFaces(null);
    setScore(null);
    setAnswers([]);
    setCurrentIndex(0);
    setShowingFace(true);
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

  const progressPercent = showingFace && itemShowMs > 0 ? (timeLeft / itemShowMs) * 100 : 0;
  const isLowTime = progressPercent < 30;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/favicon.ico" alt="Memorio logo" className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50 text-sm sm:text-base">Memorio</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.dashboard')}
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
      <main className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {t('exercises.namesFaces')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {phase === "idle" && t('exercises.speedEncodingChallenge')}
                {phase === "study" && t('exercises.studyPhaseMemorizeFaces')}
                {phase === "recall" && t('exercises.recallPhase')}
                {phase === "summary" && t('exercises.sessionResults')}
              </p>
            </div>
          </div>
          {skillLevel && (
            <DifficultyBadge level={skillLevel} />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4 text-sm text-red-600 dark:text-red-400 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* IDLE PHASE */}
        {phase === "idle" && (
          <IdleView loading={loading} onStart={startExercise} t={t} />
        )}

        {/* STUDY PHASE */}
        {phase === "study" && faces && (
          <StudyView 
            faces={faces}
            currentIndex={currentIndex}
            showingFace={showingFace}
            progressPercent={progressPercent}
            isLowTime={isLowTime}
            onFinish={finishStudy}
          />
        )}

        {/* RECALL PHASE */}
        {phase === "recall" && faces && (
          <RecallView
            faces={faces}
            answers={answers}
            setAnswers={setAnswers}
            submitting={submitting}
            onSubmit={submitRecall}
          />
        )}

        {/* SUMMARY PHASE */}
        {phase === "summary" && score && faces && (
          <SummaryView
            score={score}
            faces={faces}
            answers={answers}
            onReset={resetExercise}
            t={t}
          />
        )}
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
              <span>{t('exercises.namesFacesInstructions.step1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
              <span>{t('exercises.namesFacesInstructions.step2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
              <span>{t('exercises.namesFacesInstructions.step3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">•</span>
              <span>{t('exercises.namesFacesInstructions.step4')}</span>
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

function StudyView({ 
  faces, 
  currentIndex, 
  showingFace, 
  progressPercent, 
  isLowTime,
  onFinish 
}: { 
  faces: FaceData[]; 
  currentIndex: number; 
  showingFace: boolean;
  progressPercent: number;
  isLowTime: boolean;
  onFinish: () => void;
}) {
  const currentFace = faces[currentIndex];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Main Study Card */}
      <div className="relative group">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col items-center shadow-xl relative overflow-hidden">
          
          {/* Timer Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-200 dark:bg-slate-800">
            <div 
              className={`h-full transition-all duration-100 ease-linear ${
                isLowTime 
                  ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' 
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Photo Container */}
          {showingFace && currentIndex < faces.length ? (
            <div className="relative mb-4 sm:mb-6 mt-2 sm:mt-4 w-full max-w-sm">
              <div className={`
                w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-4 shadow-lg transition-all duration-300
                ${isLowTime 
                  ? 'border-red-500/50 animate-pulse' 
                  : 'border-slate-200 dark:border-slate-700 group-hover:border-indigo-500/30'
                }
              `}>
                <img 
                  src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${currentFace.imageUrl}`}
                  alt={currentFace.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="h-48 sm:h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 text-2xl mb-4 sm:mb-6">
              •••
            </div>
          )}

          {/* Name Display */}
          {showingFace && currentIndex < faces.length && (
            <div className="text-center mb-4 sm:mb-6 px-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-50 mb-2 tracking-tight">
                {currentFace.displayName}
              </h2>
              {isLowTime && (
                <p className="text-red-500 dark:text-red-400 text-xs font-bold uppercase animate-pulse">
                  Hurry Up!
                </p>
              )}
            </div>
          )}

          
        </div>
      </div>

      {/* Progress Strip */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <span>Progress</span>
          <span>{currentIndex + 1} / {faces.length}</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / faces.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        {faces.map((face, idx) => (
          <div 
            key={idx}
            className="text-center transition-opacity duration-300"
            style={{ opacity: idx <= currentIndex ? 1 : 0.3 }}
          >
            <img
              src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
              alt={idx <= currentIndex ? face.displayName : "Not shown yet"}
              className={`w-full aspect-square object-cover rounded-lg ${
                idx === currentIndex 
                  ? "ring-2 ring-indigo-500 dark:ring-indigo-400" 
                  : "border border-slate-200 dark:border-slate-700"
              }`}
              loading="lazy"
            />
            <div className={`text-[10px] sm:text-xs mt-1 truncate ${
              idx <= currentIndex 
                ? "text-slate-700 dark:text-slate-300 font-semibold" 
                : "text-slate-400 dark:text-slate-500"
            }`}>
              {idx <= currentIndex ? face.displayName : "?"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecallView({ 
  faces, 
  answers, 
  setAnswers, 
  submitting, 
  onSubmit 
}: { 
  faces: FaceData[]; 
  answers: string[]; 
  setAnswers: (answers: string[]) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <p className="text-slate-600 dark:text-slate-300 text-sm">
        Type the names you remember. Order matters for bonus points!
      </p>

      {/* Face grid with input fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {faces.map((face, idx) => (
          <div 
            key={idx}
            className="flex flex-col gap-3 p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl"
          >
            <img
              src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
              alt={`Face ${idx + 1}`}
              className="w-full aspect-square object-cover rounded-lg"
              loading="lazy"
            />
            <input
              type="text"
              value={answers[idx]}
              onChange={(e) => {
                const copy = answers.slice();
                copy[idx] = e.target.value;
                setAnswers(copy);
              }}
              placeholder={`Name #${idx + 1}`}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  );
}

function SummaryView({ 
  score, 
  faces, 
  answers, 
  onReset,
  t
}: { 
  score: SubmitResp; 
  faces: FaceData[]; 
  answers: string[];
  onReset: () => void;
  t: any;
}) {
  const accuracy = Math.round(score.accuracy * 100);
  const orderAccuracy = Math.round(score.orderAccuracy * 100);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Score Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Accuracy Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-500" />
          </div>
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">{t('exercises.accuracy')}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-50">
              {score.correct}/{score.total}
            </span>
            <span className={`text-sm font-bold ${accuracy === 100 ? "text-green-500 dark:text-green-400" : "text-orange-500 dark:text-orange-400"}`}>
              {accuracy}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${accuracy}%` }} />
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-center">
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">{t('exercises.pointsEarned')}</div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-500 flex items-center gap-2 flex-wrap">
            +{score.pointsEarned}
            {accuracy === 100 && (
              <span className="text-[10px] sm:text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-medium">
                {t('exercises.congratulations')}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {t('exercises.orderAccuracy')}: {orderAccuracy}%
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center sm:col-span-2 lg:col-span-1">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mb-2" />
          <h3 className="text-white font-bold text-sm sm:text-base">
            {accuracy === 100 ? t('exercises.congratulations') : t('exercises.goodJob')}
          </h3>
          <Link to="/dashboard" className="mt-3 w-full">
            <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
              {t('exercises.backToDashboard')}
            </button>
          </Link>
        </div>
      </div>

      {/* Detailed Review */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-50">{t('exercises.sessionResults')}</h3>
          <div className="flex gap-3 sm:gap-4 text-xs">
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {t('exercises.correct')}
            </div>
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-500" /> {t('exercises.missedWords')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {faces.map((face, idx) => {
            const userAnswer = answers[idx]?.trim().toLowerCase();
            const correctAnswer = face.displayName.trim().toLowerCase();
            const isCorrect = userAnswer === correctAnswer;
            
            return (
              <div 
                key={idx}
                className={`
                  group relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden border transition-all duration-300
                  ${isCorrect 
                    ? "border-slate-200 dark:border-slate-800 hover:border-green-500/50" 
                    : "border-red-500/30 bg-red-950/10 dark:bg-red-950/5"
                  }
                `}
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
                    alt={face.displayName}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      !isCorrect ? 'grayscale opacity-70' : ''
                    }`} 
                  />
                  
                  {/* Status Icon */}
                  <div className="absolute top-2 right-2">
                    {isCorrect ? (
                      <div className="bg-green-500 text-white p-1 rounded-full shadow-lg scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="bg-red-500 text-white p-1 rounded-full shadow-lg">
                        <X className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-2 sm:p-3">
                  <div className="font-semibold text-slate-900 dark:text-slate-50 text-xs sm:text-sm truncate" title={face.displayName}>
                    {face.displayName}
                  </div>
                  
                  {!isCorrect && (
                    <div className="mt-1.5 pt-1.5 border-t border-red-500/20">
                      <div className="text-[9px] sm:text-[10px] text-red-500 dark:text-red-400 uppercase font-bold">
                        You said:
                      </div>
                      <div className="text-[10px] sm:text-xs text-red-600 dark:text-red-300 truncate">
                        {userAnswer || "(No answer)"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
        {score.missedWords.length > 0 && (
          <button 
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm sm:text-base"
          >
            <RotateCcw className="w-4 h-4" />
            Retry ({score.missedWords.length} missed)
          </button>
        )}
        <Link to="/dashboard">
          <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm sm:text-base">
            Back to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* New Badges */}
      {!!score.newBadges?.length && (
        <div className="p-4 sm:p-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="font-bold mb-3 text-amber-900 dark:text-amber-100 text-sm sm:text-base">
            🎉 New Badges Earned!
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {score.newBadges.map((b) => (
              <BadgePill key={b} code={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== HELPER COMPONENTS ===== */

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
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span className="font-semibold text-xs text-slate-900 dark:text-slate-50">
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
