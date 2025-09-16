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

export default function Dashboard() {
  /* ===== Streak state ===== */
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [streakErr, setStreakErr] = useState<string | null>(null);

  /* ===== History state ===== */
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [histErr, setHistErr] = useState<string | null>(null);

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