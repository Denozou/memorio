import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ReviewCountDTO } from "../types/adaptive";

export default function ReviewNotificationBadge() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<ReviewCountDTO>("/api/adaptive/review-count");
        if (alive) setCount(data.count);
      } catch (e) {
        // Silently fail - this is just a notification badge
        if (alive) setCount(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading || count === 0) {
    return null;
  }

  return (
    <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold">
      {count}
    </span>
  );
}
