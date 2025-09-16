import {useState} from "react";
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
  correctWords: string[];
  missedWords: string[];
  extraAnswers: string[];
};

export default function ExerciseImageLinking(){
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [words, setWords] = useState<string[]|null>(null);
    const [error, setError] = useState<string | null>(null);

    const [phase, setPhase] = useState<'idle' | 'study' | 'recall' | 'summary'>('idle');
    const [answers, setAnswers] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [score, setScore] = useState<SubmitResp | null>(null);
    async function startExercise(){
        setError(null);
        setLoading(true);
        try{
            const {data} = await api.post<StartResp>("/exercises/start",{type: "IMAGE_LINKING"} as StartReq);
            setSessionId(data.sessionId);
            setWords(data.payload.words);
            setAnswers(new Array(data.payload.words.length).fill(""));
            setPhase("study");
        }catch(err: any){
            setError(err?.response?.data?.error ?? "Failed to start exercise");
        }finally{
            setLoading(false);
        }
    }
    function finishStudy(){
        setPhase("recall");
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
    const studySeconds = 10;
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
                  <ul style={{ display: "grid", gap: 6, paddingLeft: 18 }}>
                    {words.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                  <Button onClick={finishStudy} variant="secondary">I’m ready</Button>
                </div>
              )}
    
              {phase === "recall" && words && (
                <div style={{ display: "grid", gap: 12 }}>
                  <p>Type the words you remember (order doesn’t matter for MVP).</p>
                  <div style={{ display: "grid", gap: 8 }}>
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
                      />
                    ))}
                  </div>
                  <Button variant="primary" onClick={submitRecall} disabled={submitting} loading={submitting}>
                    Continue
                  </Button>
                </div>
              )}
    
              {phase === "summary" && score && (
                <div style={{ display: "grid", gap: 12 }}>
                  <p>
                    Accuracy: <b>{Math.round(score.accuracy * 100)}%</b> ({score.correct}/{score.total})
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <b>Correct</b>
                      <ul style={{ paddingLeft: 18, color: "#059669" }}>
                        {score.correctWords.length ? score.correctWords.map((w, i) => <li key={i}>{w}</li>) : <li>—</li>}
                      </ul>
                    </div>
                    <div>
                      <b>Missed</b>
                      <ul style={{ paddingLeft: 18, color: "#ef4444" }}>
                        {score.missedWords.length ? score.missedWords.map((w, i) => <li key={i}>{w}</li>) : <li>—</li>}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <b>Extra answers</b>
                    <ul style={{ paddingLeft: 18, color: "#6b7280" }}>
                      {score.extraAnswers.length ? score.extraAnswers.map((w, i) => <li key={i}>{w}</li>) : <li>—</li>}
                    </ul>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <a href="/dashboard"><Button variant="secondary">Back to Dashboard</Button></a>
                    <Button
                      variant="ghost"
                      onClick={() => { setPhase("idle"); setSessionId(null); setWords(null); setScore(null); }}
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

