import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { queryKeys } from "../lib/queryClient";
import type { ArticleListDto, ArticleDetailDto, UserProgressDto, QuizDto, QuizResultDto } from "../types/learning";

// ============================================
// Types
// ============================================

export type ExerciseType = "WORD_LINKING" | "NAMES_FACES" | "NUMBER_PEG" | "OBJECT_STORY" | "DAILY_CHALLENGE";

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  timezone: string;
}

export interface HistoryItem {
  sessionId: string;
  type: ExerciseType;
  startedAt: string;
  finishedAt: string | null;
  attemptCount: number;
  lastCorrect: number | null;
  lastTotal: number | null;
  lastAccuracy: number | null;
}

export interface HistoryResponse {
  items: HistoryItem[];
  limit: number;
  offset: number;
  total: number;
}

export interface Progress {
  totalPoints: number;
  totalAttempts: number;
  totalCorrect: number;
  badges: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  preferredLanguage: string;
  createdAt: string;
}

export interface ProfileUpdate {
  displayName?: string;
  preferredLanguage?: string;
}

// ============================================
// Dashboard Hooks
// ============================================

/**
 * Fetches the user's current streak data
 */
export function useStreak() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  return useQuery({
    queryKey: queryKeys.exercises.streak(tz),
    queryFn: async () => {
      const { data } = await api.get<Streak>("/exercises/streak", { params: { tz } });
      return data;
    },
    staleTime: 5 * 60 * 1000, // Streak is fresh for 5 minutes
  });
}

/**
 * Fetches the user's exercise history
 */
export function useExerciseHistory(limit = 200, offset = 0) {
  return useQuery({
    queryKey: queryKeys.exercises.history(limit, offset),
    queryFn: async () => {
      const { data } = await api.get<HistoryResponse>("/exercises/history", {
        params: { limit, offset },
      });
      return data;
    },
    staleTime: 2 * 60 * 1000, // History fresh for 2 minutes
  });
}

/**
 * Fetches the user's progress (points and badges)
 */
export function useProgress() {
  return useQuery({
    queryKey: queryKeys.progress.user(),
    queryFn: async () => {
      const { data } = await api.get<Progress>("/progress");
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// User Profile Hooks
// ============================================

/**
 * Fetches the user's profile
 */
export function useUserProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: async () => {
      const { data } = await api.get<UserProfile>("/users/profile");
      return data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Updates the user's profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      const { data } = await api.put<UserProfile>("/users/profile", updates);
      return data;
    },
    onSuccess: () => {
      // Invalidate profile cache after update
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}

// ============================================
// Learning Hub Hooks
// ============================================

/**
 * Fetches all articles
 */
export function useArticles() {
  return useQuery({
    queryKey: queryKeys.learning.articles(),
    queryFn: async () => {
      const { data } = await api.get<ArticleListDto[]>("/api/learning/articles");
      return data;
    },
    staleTime: 5 * 60 * 1000, // Articles fresh for 5 minutes
  });
}

/**
 * Fetches a single article by slug
 */
export function useArticle(slug: string) {
  return useQuery({
    queryKey: queryKeys.learning.article(slug),
    queryFn: async () => {
      const { data } = await api.get<ArticleDetailDto>(`/api/learning/articles/${slug}`);
      return data;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // Articles are fairly static
  });
}

/**
 * Fetches the user's learning progress
 */
export function useLearningProgress() {
  return useQuery({
    queryKey: queryKeys.learning.progress(),
    queryFn: async () => {
      const { data } = await api.get<UserProgressDto>("/api/learning/progress");
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Marks an article as read
 */
export function useMarkArticleRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: string) => {
      await api.post(`/api/learning/articles/${articleId}/mark-read`);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.articles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.progress() });
    },
  });
}

/**
 * Fetches quiz for an article
 */
export function useArticleQuiz(articleId: string) {
  return useQuery({
    queryKey: [...queryKeys.learning.all, "quiz", articleId],
    queryFn: async () => {
      const { data } = await api.get<QuizDto>(`/api/learning/articles/${articleId}/quiz`);
      return data;
    },
    enabled: !!articleId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Submits quiz answers
 */
export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, selectedOptionIds }: { quizId: string; selectedOptionIds: string[] }) => {
      const { data } = await api.post<QuizResultDto>(`/api/learning/quizzes/${quizId}/submit`, {
        quizId,
        selectedOptionIds,
      });
      return data;
    },
    onSuccess: () => {
      // Invalidate articles (quiz completion status changed)
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.articles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.learning.progress() });
      // Also invalidate progress since quiz completion may award points/badges
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.user() });
    },
  });
}

// ============================================
// Logout Hook
// ============================================

/**
 * Handles user logout and cache clearing
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
  });
}
