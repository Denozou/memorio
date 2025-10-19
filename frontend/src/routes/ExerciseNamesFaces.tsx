import { useState, useEffect } from "react";
import { api } from "../lib/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import Timer from "../components/ui/Timer";

/* ===== Types ===== */
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
  timingConfig?: {          // NEW: timing from backend
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


  // Timing for face display during study

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

      // NEW: Read timing from backend response
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

  function pct(x: number) {
    return Math.round((x ?? 0) * 100);
  }

  return (
    <div style={{ 
      fontFamily: "system-ui", 
      padding: "16px", 
      display: "grid", 
      gap: 16, 
      maxWidth: 800, 
      margin: "0 auto",
      minHeight: "100vh"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: "clamp(24px, 5vw, 32px)" }}>Names & Faces</h1>
        <a href="/dashboard"><Button variant="ghost">← Dashboard</Button></a>
      </div>

      <Card>
        <CardHeader
          title={
            phase === "idle" ? "Start a new session"
            : phase === "study" ? "Study Phase"
            : phase === "recall" ? "Recall Phase"
            : "Results"
          }
          subtitle={sessionId ? `Session: ${sessionId.substring(0, 8)}...` : undefined}
        />
        <CardContent>
          {error && (
            <div style={{ 
              color: "#ef4444", 
              marginBottom: 12, 
              padding: 12, 
              background: "#fef2f2", 
              borderRadius: 8,
              border: "1px solid #fecaca"
            }}>
              {error}
            </div>
          )}

          {/* ===== IDLE PHASE ===== */}
          {phase === "idle" && (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ 
                padding: 16, 
                background: "#f0f9ff", 
                borderRadius: 12, 
                border: "1px solid #bfdbfe" 
              }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#1e40af" }}>How it works</h3>
                <ul style={{ margin: 0, paddingLeft: 20, color: "#1e3a8a" }}>
                  <li>Study faces and names for a limited time</li>
                  <li>Try to remember as many names as possible</li>
                  <li>Type the names in the recall phase</li>
                  <li>Get points based on accuracy and order</li>
                </ul>
              </div>
              <Button onClick={startExercise} loading={loading} variant="primary" style={{ padding: "12px 24px", fontSize: 16 }}>
                Start Exercise
              </Button>
            </div>
          )}

          {/* ===== STUDY PHASE ===== */}
          {phase === "study" && faces && (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <span style={{ color: "#6b7280", fontSize: 14 }}>Memorize these faces and names</span>
                <Timer seconds={studySeconds} onFinish={finishStudy} />
              </div>

              <DifficultyIndicator level={skillLevel} itemCount={faces.length} />

              {/* Face display area */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
                padding: 24,
                background: "#f9fafb",
                borderRadius: 16,
                border: "1px solid #e5e7eb"
              }}>
                {showingFace && currentIndex < faces.length ? (
                  <FaceCard face={faces[currentIndex]} />
                ) : (
                  <div style={{ color: "#9ca3af", fontSize: 18 }}>•••</div>
                )}
              </div>

              {/* Progress indicator */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ color: "#6b7280", fontSize: 14 }}>
                  {currentIndex + 1} / {faces.length} faces shown
                </div>
                <Button onClick={finishStudy} variant="secondary">I'm ready to recall</Button>
              </div>

              {/* Thumbnail strip for review */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", 
                gap: 8,
                padding: 12,
                background: "white",
                borderRadius: 12,
                border: "1px solid #e5e7eb"
              }}>
                {faces.map((face, idx) => (
                  <div 
                    key={idx}
                    style={{
                      opacity: idx <= currentIndex ? 1 : 0.3,
                      transition: "opacity 0.3s",
                      textAlign: "center"
                    }}
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
                      alt={idx <= currentIndex ? face.displayName : "Not shown yet"}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: 8,
                        border: idx === currentIndex ? "2px solid #3b82f6" : "1px solid #e5e7eb"
                      }}
                      loading="lazy"
                    />
                    <div style={{ 
                      fontSize: 11, 
                      marginTop: 4, 
                      color: idx <= currentIndex ? "#374151" : "#9ca3af",
                      fontWeight: idx === currentIndex ? 600 : 400
                    }}>
                      {idx <= currentIndex ? face.displayName : "?"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== RECALL PHASE ===== */}
          {phase === "recall" && faces && (
            <div style={{ display: "grid", gap: 16 }}>
              <DifficultyIndicator level={skillLevel} itemCount={faces.length} />
              
              <p style={{ color: "#6b7280", margin: 0 }}>
                Type the names you remember. Order matters for bonus points!
              </p>

              {/* Face grid with input fields */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                gap: 16 
              }}>
                {faces.map((face, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      padding: 12,
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12
                    }}
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
                      alt={`Face ${idx + 1}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: 8
                      }}
                      loading="lazy"
                    />
                    <Input
                      value={answers[idx]}
                      onChange={e => {
                        const copy = answers.slice();
                        copy[idx] = e.target.value;
                        setAnswers(copy);
                      }}
                      placeholder={`Name #${idx + 1}`}
                      style={{ width: "100%" }}
                    />
                  </div>
                ))}
              </div>

              <Button 
                variant="primary" 
                onClick={submitRecall} 
                disabled={submitting} 
                loading={submitting}
                style={{ padding: "12px 24px", fontSize: 16 }}
              >
                Submit Answers
              </Button>
            </div>
          )}

          {/* ===== SUMMARY PHASE ===== */}
          {phase === "summary" && score && faces && (
            <div style={{ display: "grid", gap: 16 }}>
              {/* Headline metrics */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                gap: 12 
              }}>
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
              <div style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#fafafa",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Points earned</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#059669" }}>
                    +{score.pointsEarned}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  includes bonus for correct order
                </div>
              </div>

              {/* Correct / missed / extra lists */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
                gap: 12 
              }}>
                <ListCard title="✓ Correct" items={score.correctWords} color="#059669" />
                <ListCard title="✗ Missed" items={score.missedWords} color="#ef4444" />
                <ListCard title="⚠ Extra answers" items={score.extraAnswers} color="#6b7280" />
              </div>

              {/* New badges */}
              {!!score.newBadges?.length && (
                <div style={{ 
                  padding: 16, 
                  background: "#fef3c7", 
                  borderRadius: 12, 
                  border: "1px solid #fbbf24" 
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: "#92400e" }}>
                    🎉 New Badges Earned!
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {score.newBadges.map((b) => (
                      <BadgePill key={b} code={b} />
                    ))}
                  </div>
                </div>
              )}

              {/* Review section - show faces with correct answers */}
              <div style={{ 
                padding: 16, 
                background: "#f9fafb", 
                borderRadius: 12, 
                border: "1px solid #e5e7eb" 
              }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700 }}>Review</h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                  gap: 12 
                }}>
                  {faces.map((face, idx) => {
                    const userAnswer = answers[idx]?.trim().toLowerCase();
                    const correctAnswer = face.displayName.trim().toLowerCase();
                    const isCorrect = userAnswer === correctAnswer;
                    
                    return (
                      <div 
                        key={idx}
                        style={{
                          padding: 12,
                          background: "white",
                          border: `2px solid ${isCorrect ? "#10b981" : "#ef4444"}`,
                          borderRadius: 12
                        }}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
                          alt={face.displayName}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            objectFit: "cover",
                            borderRadius: 8,
                            marginBottom: 8
                          }}
                          loading="lazy"
                        />
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                          {face.displayName}
                        </div>
                        {!isCorrect && userAnswer && (
                          <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>
                            You wrote: {answers[idx] || "(empty)"}
                          </div>
                        )}
                        {!userAnswer && (
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                            (no answer)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href="/dashboard" style={{ flex: "1 1 auto" }}>
                  <Button variant="secondary" style={{ width: "100%" }}>Back to Dashboard</Button>
                </a>
                <Button
                  variant="ghost"
                  onClick={resetExercise}
                  style={{ flex: "1 1 auto" }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ===== Helper Components ===== */

function FaceCard({ face }: { face: FaceData }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      maxWidth: 400,
      width: "100%"
    }}>
      <img
        src={`${import.meta.env.VITE_API_URL || "http://localhost:8080"}${face.imageUrl}`}
        alt={face.displayName}
        style={{
          width: "100%",
          maxWidth: 300,
          aspectRatio: "1",
          objectFit: "cover",
          borderRadius: 16,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "2px solid white"
        }}
      />
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: "#111827",
        textAlign: "center",
        padding: "8px 16px",
        background: "white",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        {face.displayName}
      </div>
    </div>
  );
}

function DifficultyIndicator({ level, itemCount }: { level: number | null; itemCount: number }) {
  if (!level) return null;

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return "#10b981"; // Green for easy
    if (level <= 6) return "#f59e0b"; // Yellow for medium
    return "#ef4444"; // Red for hard
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 3) return "Easy";
    if (level <= 6) return "Medium";
    return "Hard";
  };

  const color = getDifficultyColor(level);
  const label = getDifficultyLabel(level);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#f9fafb",
      flexWrap: "wrap"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: color
        }} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          Level {level} - {label}
        </span>
      </div>
      <div style={{
        marginLeft: "auto",
        color: "#6b7280",
        fontSize: 14
      }}>
        {itemCount} faces to memorize
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <div style={{ color: "#6b7280", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: "#6b7280", fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

function ListCard({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{title}</div>
      {items?.length ? (
        <ul style={{ paddingLeft: 18, margin: 0, color, fontSize: 14 }}>
          {items.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      ) : (
        <div style={{ color: "#9ca3af", fontSize: 14 }}>—</div>
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
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      background: "white",
      fontSize: 13,
      fontWeight: 600,
    }}>
      <span aria-hidden>{emoji}</span>{pretty}
    </span>
  );
}
