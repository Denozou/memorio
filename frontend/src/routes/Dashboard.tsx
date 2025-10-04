import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Button from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";

/* ===== Types ===== */
type Streak = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // ISO date (YYYY-MM-DD) or null
  timezone: string;
};

type HistoryItem = {
  sessionId: string;
  type: "IMAGE_LINKING" | "NAMES_FACES" | "OBJECT_STORY" | "DAILY_CHALLENGE";
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

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, display: "grid", gap: 16 }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/exercise/image-linking"><Button variant="primary">Start Image Linking</Button></a>
        <a href="/profile"><Button variant="secondary">Profile</Button></a>
      </div>

      {/* ===== Streak Card ===== */}
      <Card>
        <CardHeader title="Your streak" subtitle="Keep the chain going 🔥" />
        <CardContent>
          {loadingStreak && <div>Loading streak…</div>}
          {streakErr && <div style={{ color: "#ef4444" }}>{streakErr}</div>}
          {streak && <StreakBadge data={streak} />}
        </CardContent>
      </Card>

      {/* ===== Recent Sessions Card ===== */}
      <Card>
        <CardHeader title="Recent sessions" subtitle="Your last 5 results" />
        <CardContent>
          {loadingHist && <div>Loading history…</div>}
          {histErr && <div style={{ color: "#ef4444" }}>{histErr}</div>}
          {history && <HistoryList items={history} />}
          {history && history.length === 0 && <div>No sessions yet. Start one above!</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Progress" subtitle="Points & badges" />
        <CardContent>
          {loadingProg && <div>Loading progress…</div>}
          {progErr && <div style={{ color: "#ef4444" }}>{progErr}</div>}
          {progress && <ProgressView data={progress} />}
        </CardContent>
      </Card>
    </div>
  );
}

/* ===== Small components/helpers ===== */

function StreakBadge({ data }: { data: Streak }) {
  const d = data.lastActiveDate ? new Date(data.lastActiveDate + "T00:00:00") : null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: 12,
      border: "1px solid #e5e7eb",
      borderRadius: 14,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 12, display: "grid",
        placeItems: "center", fontSize: 24, border: "1px solid #e5e7eb"
      }}>
        🔥
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {data.currentStreak} day{data.currentStreak === 1 ? "" : "s"} streak
        </div>
        <div style={{ color: "#6b7280" }}>
          Longest: <b>{data.longestStreak}</b>
          {d && <> · Last active: {d.toLocaleDateString()}</>}
          <> · TZ: {data.timezone}</>
        </div>
      </div>
    </div>
  );
}

function HistoryList({ items }: { items: HistoryItem[] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((s) => (
        <div key={s.sessionId}
             style={{
               display: "grid",
               gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
               gap: 8,
               alignItems: "center",
               padding: "10px 12px",
               border: "1px solid #e5e7eb",
               borderRadius: 12
             }}>
          <div><TypeBadge type={s.type} /></div>
          <div style={{ color: "#6b7280" }}>{formatDateTime(s.startedAt)}</div>
          <div style={{ fontWeight: 600 }}>{scoreText(s.lastCorrect, s.lastTotal, s.lastAccuracy)}</div>
          <div style={{ textAlign: "right" }}>
            <a href={`/exercise/image-linking`}><Button variant="ghost">Retry</Button></a>
          </div>
        </div>
      ))}
    </div>
  );
}

////


function ProgressView({ data }: { data: Progress }) {
  const accPct =
    data.totalAttempts > 0 && data.totalCorrect >= 0
      ? Math.round((data.totalCorrect / Math.max(1, data.totalAttempts * 6)) * 100) // rough: assume 6 targets per attempt for now
      : 0;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Metric label="Points" value={data.totalPoints.toString()} />
        <Metric label="Attempts" value={data.totalAttempts.toString()} />
        <Metric label="Correct" value={data.totalCorrect.toString()} sub={`${accPct}% est. accuracy`} />
      </div>

      <div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Badges</div>
        {data.badges.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No badges yet — start a session to earn your first one!</div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {data.badges.map((b) => (
              <BadgePill key={b} code={b} />
            ))}
          </div>
        )}
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

function BadgePill({ code }: { code: string }) {
  const pretty = code
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());

  const emoji = badgeEmoji(code);

  return (
    <span
      title={pretty}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#f9fafb",
        fontSize: 12,
        fontWeight: 600,
      }}
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



////
function TypeBadge({ type }: { type: HistoryItem["type"] }) {
  const label = type
    .replace("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (m) => m.toUpperCase());
  return (
    <span style={{
      padding: "4px 8px",
      borderRadius: 999,
      border: "1px solid #e5e7eb",
      fontSize: 12
    }}>
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