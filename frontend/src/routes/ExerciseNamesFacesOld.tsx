import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { 
  LogOut, Menu, X, AlertCircle, ArrowRight, Brain, 
  Trophy, Check, RotateCcw, Clock, Target
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

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
  timingConfig?: {          //timing from backend
    studySeconds: number;
    itemShowMs: number;
    gapMs: number;
  };
};

type SubmitReq = {
  sessionId: string;
  type: "NAMES_FACES";
  shownWords: string[]; // displayNames shown
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
  
  // Timer state for study phase
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);


  //timing for face display during study

  // Effect to handle face transitions during study
  useEffect(() => {
    if (phase !== "study" || !faces) return;

    const timer = setTimeout(() => {
      if (showingFace) {
        // Currently showing a face, switch to gap
        setShowingFace(false);
      } else {
        // Currently in gap
        if (currentIndex < faces.length - 1) {
          // Move to next face
          setCurrentIndex(prev => prev + 1);
          setShowingFace(true);
        }
        // If we've shown all faces, just stay on the last one
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

      //Readd timing from backend response
      if (data.timingConfig) {
          setStudySeconds(data.timingConfig.studySeconds);
          setItemShowMs(data.timingConfig.itemShowMs);
          setGapMs(data.timingConfig.gapMs);
      }
      setPhase("study");
      setCurrentIndex(0);
      setShowingFace(true);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to start exercise");
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

  function pct(x: number) {
    return Math.round((x ?? 0) * 100);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/favicon.ico" alt="Memorio logo" className="h-8 w-8" />
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
            👤 Names & Faces
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {phase === "idle" && "Memorize faces and recall their names"}
            {phase === "study" && "Study Phase - Memorize these faces"}
            {phase === "recall" && "Recall Phase - Type the names you remember"}
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

        {/* IDLE PHASE */}
        {phase === "idle" && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-6 sm:p-8 space-y-6">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">How it works</h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Study faces and names for a limited time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Try to remember as many names as possible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Type the names in the recall phase</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Get points based on accuracy and order</span>
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

        {/*  STUDY PHASE  */}
        {phase === "study" && faces && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">Memorize these faces and names</span>
              {/* <Timer seconds={studySeconds} onFinish={finishStudy} /> */}
            </div>

            <DifficultyIndicator level={skillLevel} itemCount={faces.length} />

            {/* Face display area */}
            <div className="flex flex-col items-center justify-center min-h-[400px] p-6 sm:p-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              {showingFace && currentIndex < faces.length ? (
                <FaceCard face={faces[currentIndex]} />
              ) : (
                <div className="text-slate-400 dark:text-slate-500 text-2xl">•••</div>
              )}
            </div>

            {/* Progress indicator */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {currentIndex + 1} / {faces.length} faces shown
              </div>
              <button
                onClick={finishStudy}
                className="px-5 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                I'm ready to recall
              </button>
            </div>

            {/* Thumbnail strip for review */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
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
                  <div className={`text-xs mt-1 ${
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
        )}

        {/* RECALL PHASE */}
        {phase === "recall" && faces && (
          <div className="space-y-6">
            <DifficultyIndicator level={skillLevel} itemCount={faces.length} />
            
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Type the names you remember. Order matters for bonus points!
            </p>

            {/* Face grid with input fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {faces.map((face, idx) => (
                <div 
                  key={idx}
                  className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const copy = answers.slice();
                      copy[idx] = e.target.value;
                      setAnswers(copy);
                    }}
                    placeholder={`Name #${idx + 1}`}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
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

        {/* SUMMARY PHASE */}
        {phase === "summary" && score && faces && (
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

            {/* Review section - show faces with correct answers */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Review</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {faces.map((face, idx) => {
                  const userAnswer = answers[idx]?.trim().toLowerCase();
                  const correctAnswer = face.displayName.trim().toLowerCase();
                  const isCorrect = userAnswer === correctAnswer;
                  
                  return (
                    <div 
                      key={idx}
                      className={`p-3 bg-white dark:bg-slate-900 rounded-xl border-2 ${
                        isCorrect 
                          ? "border-green-500 dark:border-green-400" 
                          : "border-red-500 dark:border-red-400"
                      }`}
                    >
                      <img
                        src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
                        alt={face.displayName}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                        loading="lazy"
                      />
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {face.displayName}
                      </div>
                      {!isCorrect && userAnswer && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          You wrote: {answers[idx] || "(empty)"}
                        </div>
                      )}
                      {!userAnswer && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          (no answer)
                        </div>
                      )}
                    </div>
                  );
                })}
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

/* ===== Helper Components ===== */

function FaceCard({ face }: { face: FaceData }) {
  return (
    <div className="flex flex-col items-center gap-4 max-w-md w-full">
      <img
        src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
        alt={face.displayName}
        className="w-full max-w-xs aspect-square object-cover rounded-2xl shadow-lg border-4 border-white dark:border-slate-800"
      />
      <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 text-center px-6 py-3 bg-white dark:bg-slate-800 rounded-xl shadow-md">
        {face.displayName}
      </div>
    </div>
  );
}

function DifficultyIndicator({ level, itemCount }: { level: number | null; itemCount: number }) {
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
        {itemCount} faces to memorize
      </div>
    </div>
  );
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
