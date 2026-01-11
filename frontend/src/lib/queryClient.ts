import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query key factory for consistent cache keys
export const queryKeys = {
  // User-related queries
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
  },
  // Exercise/dashboard queries
  exercises: {
    all: ["exercises"] as const,
    streak: (tz: string) => [...queryKeys.exercises.all, "streak", tz] as const,
    history: (limit: number, offset: number) =>
      [...queryKeys.exercises.all, "history", { limit, offset }] as const,
  },
  // Progress queries
  progress: {
    all: ["progress"] as const,
    user: () => [...queryKeys.progress.all, "user"] as const,
  },
  // Learning queries
  learning: {
    all: ["learning"] as const,
    articles: () => [...queryKeys.learning.all, "articles"] as const,
    article: (slug: string) => [...queryKeys.learning.all, "article", slug] as const,
    progress: () => [...queryKeys.learning.all, "progress"] as const,
  },
  // Leaderboard
  leaderboard: {
    all: ["leaderboard"] as const,
    list: () => [...queryKeys.leaderboard.all, "list"] as const,
  },
} as const;
