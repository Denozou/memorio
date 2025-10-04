import {useState, useEffect} from "react";
import {api} from "../lib/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import Timer from "../components/ui/Timer";

type StartReq = {type: "IMAGE_LINKING"};
type StartResp = {
    sessionId: string;
    type: "IMAGE_LINKING";
    payload:{words: string[]};
    skillLevel?: number; // Add skill level to response
};
type SubmitReq = {
  sessionId: string;
  type: "IMAGE_LINKING";
  shownWords: string[];
  answers: string[];
};

type SubmitResp = {
  sessionId: string;
  type: "IMAGE_LINKING";
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

export default function ExerciseImageLinking(){
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [words, setWords] = useState<string[]|null>(null);
    const [error, setError] = useState<string | null>(null);
    const [skillLevel, setSkillLevel] = useState<number | null>(null);

    const [phase, setPhase] = useState<'idle' | 'study' | 'recall' | 'summary'>('idle');
    const [answers, setAnswers] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState<SubmitResp | null>(null);

    // Dynamic study time calculation based on word count
    const calculateStudyTime = (wordCount: number, skillLevel: number | null = null) => {
        // Base time per word varies by skill level - beginners get more time
        const getTimePerWord = (level: number | null) => {
            if (!level) return 2.0; // Default for unknown level

            // More time for beginners, less for advanced users
            if (level <= 2) return 2.5;      // Beginners: 2.5s per word
            if (level <= 4) return 2.0;      // Intermediate: 2.0s per word
            if (level <= 6) return 1.7;      // Advanced: 1.7s per word
            return 1.5;                      // Expert: 1.5s per word
        };

        const baseTimePerWord = getTimePerWord(skillLevel);
        const bufferTime = 10;
        const calculatedTime = (wordCount * baseTimePerWord) + bufferTime;

        // Set reasonable bounds
        const minStudyTime = 20; // Minimum 20 seconds
        const maxStudyTime = 90; // Increased max for beginners with many words

        return Math.max(minStudyTime, Math.min(maxStudyTime, calculatedTime));
    };

    // Calculate dynamic study time based on current word count and skill level
    const studySeconds = words ? calculateStudyTime(words.length, skillLevel) : 40;

    // Dynamic timing calculation based on word count
    const calculateTiming = (wordCount: number) => {
        const totalStudyTimeMs = studySeconds * 1000;
        const totalCycleTime = totalStudyTimeMs / wordCount; // Time per word + gap

        // Set minimum and maximum constraints for readability
        const minShowTime = 800;  // Minimum 0.8s per word
        const maxShowTime = 2500; // Maximum 2.5s per word
        const gapRatio = 0.2;     // Gap should be 20% of show time

        let showTime = totalCycleTime * (1 - gapRatio);

        // Apply constraints
        if (showTime < minShowTime) {
            showTime = minShowTime;
        } else if (showTime > maxShowTime) {
            showTime = maxShowTime;
        }

        const gapTime = showTime * gapRatio;

        return {
            showMs: Math.round(showTime),
            gapMs: Math.round(gapTime)
        };
    };

    // Calculate dynamic timing based on current word count
    const timing = words ? calculateTiming(words.length) : { showMs: 1600, gapMs: 400 };
    const SHOW_MS = timing.showMs;
    const GAP_MS = timing.gapMs;

    const [playing, setPlaying] = useState(false);
    const [index, setIndex] = useState(0);   // current word index during study
    const [tick, setTick] = useState<"show" | "gap">("show"); // what we’re showing now

    // Effect to handle word transitions
    useEffect(() => {
        let timer: number;

        if (playing && words) {
            if (tick === "show") {
                // Currently showing a word
                timer = setTimeout(() => {
                    setTick("gap");
                }, SHOW_MS);
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
                }, GAP_MS);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [playing, tick, index, words]);

    async function startExercise(){
        setError(null);
        setLoading(true);
        try{
            const {data} = await api.post<StartResp>("/exercises/start",{type: "IMAGE_LINKING"} as StartReq);
            setSessionId(data.sessionId);
            setWords(data.payload.words);
            setAnswers(new Array(data.payload.words.length).fill(""));
            setPhase("study");
            setIndex(0);
            setPlaying(true);
            setSkillLevel(data.skillLevel ?? null);
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
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
          {items?.length ? (
            <ul style={{ paddingLeft: 18, margin: 0, color }}>
              {items.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          ) : (
            <div style={{ color: "#6b7280" }}>—</div>
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
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          fontSize: 12,
          fontWeight: 600,
        }}>
          <span aria-hidden>{emoji}</span>{pretty}
        </span>
      );
    }
    function DifficultyIndicator({ level, wordCount }: { level: number | null; wordCount: number }) {
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
              marginBottom: 12
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
          type: "IMAGE_LINKING",
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
        <div style={{ fontFamily: "system-ui", padding: 24, display: "grid", gap: 16, maxWidth: 720, margin: "0 auto" }}>
          <h1>Image Linking — MVP Stub</h1>

          <Card>
            <CardHeader
              title={phase === "idle" ? "Start a new session"
                    : phase === "study" ? "Study"
                    : phase === "recall" ? "Recall"
                    : "Summary"}
              subtitle={sessionId ? `Session: ${sessionId}` : undefined}
            />
            <CardContent>
              {error && <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>}

              {phase === "idle" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <p>Click start to fetch a word list from the backend.</p>
                  <Button onClick={startExercise} loading={loading} variant="primary">Start</Button>
                </div>
              )}

              {phase === "study" && words && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#6b7280" }}>Memorize these words</span>
                    <Timer seconds={studySeconds} onFinish={finishStudy} />
                  </div>
                  <DifficultyIndicator level={skillLevel} wordCount={words.length} />
                  <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100px",
                    fontSize: "24px",
                    fontWeight: "bold"
                  }}>
                    {playing && index < words.length && tick === "show" && (
                      <div>{words[index]}</div>
                    )}
                    {playing && tick === "gap" && (
                      <div style={{ color: "#d1d5db" }}>•••</div>
                    )}
                    {(!playing || index >= words.length) && (
                      <div style={{ color: "#6b7280", fontSize: "18px" }}>
                        {index >= words.length ? "All words shown" : "Starting..."}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: "#6b7280", fontSize: "14px" }}>
                      {index}/{words.length} words shown
                    </div>
                    <Button onClick={finishStudy} variant="secondary">I'm ready</Button>
                  </div>
                </div>
              )}

              {phase === "recall" && words && (
                <div style={{ display: "grid", gap: 12 }}>
                  <DifficultyIndicator level={skillLevel} wordCount={words.length} />
                  <p>Type the words you remember.</p>
                  <div style={{ display: "grid", gap: 8, maxWidth: "100%", width: "100%" }}>
                    {answers.map((val, i) => (
                      <Input
                        key={i}
                        value={val}
                        onChange={e => {
                          const copy = answers.slice();
                          copy[i] = e.target.value;
                          setAnswers(copy);
                        }}
                        placeholder={`Word #${i + 1}`}
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    ))}
                  </div>
                  <Button variant="primary" onClick={submitRecall} disabled={submitting} loading={submitting}>
                    Continue
                  </Button>
                </div>
              )}

              {phase === "summary" && score && (
                <div style={{ display: "grid", gap: 16 }}>
                  {/* Headline metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
                  <div
                    style={{
                      padding: 12,
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      background: "#fafafa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Points earned</div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{score.pointsEarned}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      includes bonus for correct order
                    </div>
                  </div>

                  {/* Correct / missed / extra lists */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <ListCard title="Correct" items={score.correctWords} color="#059669" />
                    <ListCard title="Missed" items={score.missedWords} color="#ef4444" />
                    <ListCard title="Extra answers" items={score.extraAnswers} color="#6b7280" />
                  </div>

                  {/* New badges (if any) */}
                  {!!score.newBadges?.length && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {score.newBadges.map((b) => (
                        <BadgePill key={b} code={b} />
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <a href="/dashboard"><Button variant="secondary">Back to Dashboard</Button></a>
                    <Button
                      variant="ghost"
                      onClick={() => { setPhase("idle"); setSessionId(null); setWords(null); setScore(null); setAnswers([]); }}
                    >
                      Start again
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
}
