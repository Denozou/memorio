import { useEffect, useRef, useState } from "react";

type Props = {
  /** seconds to count down from */
  seconds: number;
  onFinish?: () => void;
  running?: boolean;         // default true
};

export default function Timer({ seconds, onFinish, running = true }: Props) {
  const [left, setLeft] = useState(seconds);
  const intervalRef = useRef<number | null>(null);

  // start/stop
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    if (intervalRef.current) return; // already running

    const start = Date.now();
    const end = start + left * 1000;

    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((end - now) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        onFinish?.();
      }
    }, 200);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]); // deliberately ignore `left` changes to avoid resetting

  // simple mm:ss
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div style={{ fontFamily: "system-ui", fontVariantNumeric: "tabular-nums" }}>
      ⏱ {mm}:{ss}
    </div>
  );
}