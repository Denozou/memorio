import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import { lazyWithRetry } from "./lib/lazyWithRetry";
import "./i18n/config"; // Initialize i18n
import "./index.css";

// Eagerly load critical routes
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

// Lazy load all page components with retry logic for HMR resilience
const LandingPage = lazyWithRetry(() => import("./routes/LandingPage"));
const Login = lazyWithRetry(() => import("./routes/Login"));
const SignUp = lazyWithRetry(() => import("./routes/SignUp"));
const Dashboard = lazyWithRetry(() => import("./routes/Dashboard"));
const Profile = lazyWithRetry(() => import("./routes/Profile"));
const OAuth2Success = lazyWithRetry(() => import("./routes/OAuth2Success"));
const VerifyEmail = lazyWithRetry(() => import("./routes/VerifyEmail"));
const RequestPasswordReset = lazyWithRetry(() => import("./routes/RequestPasswordReset"));
const ResetPassword = lazyWithRetry(() => import("./routes/ResetPassword"));
const TwoFactorVerify = lazyWithRetry(() => import("./routes/TwoFactorVerify"));
const TwoFactorSetup = lazyWithRetry(() => import("./routes/TwoFactorSetup"));
const TwoFactorDisable = lazyWithRetry(() => import("./routes/TwoFactorDisable"));
const ExerciseWordLinking = lazyWithRetry(() => import("./routes/ExerciseWordLinking"));
const ExerciseNamesFaces = lazyWithRetry(() => import("./routes/ExerciseNamesFaces"));
const ExerciseNumberPeg = lazyWithRetry(() => import("./routes/ExerciseNumberPeg"));
const LearningHub = lazyWithRetry(() => import("./routes/LearningHub"));
const ArticleDetail = lazyWithRetry(() => import("./routes/ArticleDetail"));
const ArticleQuiz = lazyWithRetry(() => import("./routes/ArticleQuiz"));
const AdminLearningPanel = lazyWithRetry(() => import("./routes/AdminLearningPanel"));
const AdminWordUpload = lazyWithRetry(() => import("./routes/AdminWordUpload"));
const AdminPeopleUpload = lazyWithRetry(() => import("./routes/AdminPeopleUpload"));
const IsoForestLeaderboard = lazyWithRetry(() => import("./routes/IsoForestLeaderboard"));
const Contact = lazyWithRetry(() => import("./routes/Contact"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-600 dark:text-slate-400">Loading...</span>
      </div>
    </div>
  );
}

// Wrapper for lazy components with Suspense
function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function AppShell() {
  return (
    <TutorialProvider>
      <Outlet />
    </TutorialProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", element: <LazyRoute><LandingPage /></LazyRoute> },
      { path: "/login", element: <LazyRoute><Login /></LazyRoute> },
      { path: "/signup", element: <LazyRoute><SignUp /></LazyRoute> },
      { path: "/contact", element: <LazyRoute><Contact /></LazyRoute> },
      { path: "/auth/oauth2/success", element: <LazyRoute><OAuth2Success /></LazyRoute> },
      { path: "/auth/verify-email", element: <LazyRoute><VerifyEmail /></LazyRoute> },
      { path: "/auth/forgot-password", element: <LazyRoute><RequestPasswordReset /></LazyRoute> },
      { path: "/auth/reset-password", element: <LazyRoute><ResetPassword /></LazyRoute> },
      { path: "/auth/2fa/verify", element: <LazyRoute><TwoFactorVerify /></LazyRoute> },
      { path: "/auth/2fa/setup", element: <ProtectedRoute><LazyRoute><TwoFactorSetup /></LazyRoute></ProtectedRoute> },
      { path: "/auth/2fa/disable", element: <ProtectedRoute><LazyRoute><TwoFactorDisable /></LazyRoute></ProtectedRoute> },
      { path: "/dashboard", element: <ProtectedRoute><LazyRoute><Dashboard /></LazyRoute></ProtectedRoute> },
      { path: "/profile", element: <ProtectedRoute><LazyRoute><Profile /></LazyRoute></ProtectedRoute> },
      { path: "/leaderboard", element: <ProtectedRoute><LazyRoute><IsoForestLeaderboard /></LazyRoute></ProtectedRoute> },
      { path: "/exercise/word-linking", element: <ProtectedRoute><LazyRoute><ExerciseWordLinking /></LazyRoute></ProtectedRoute> },
      { path: "/exercise/names-faces", element: <ProtectedRoute><LazyRoute><ExerciseNamesFaces /></LazyRoute></ProtectedRoute> },
      { path: "/exercise/number-peg", element: <ProtectedRoute><LazyRoute><ExerciseNumberPeg /></LazyRoute></ProtectedRoute> },
      { path: "/learning", element: <ProtectedRoute><LazyRoute><LearningHub /></LazyRoute></ProtectedRoute> },
      { path: "/learning/articles/:slug", element: <ProtectedRoute><LazyRoute><ArticleDetail /></LazyRoute></ProtectedRoute> },
      { path: "/learning/articles/:slug/quiz", element: <ProtectedRoute><LazyRoute><ArticleQuiz /></LazyRoute></ProtectedRoute> },
      { path: "/admin/learning", element: <ProtectedRoute><AdminRoute><LazyRoute><AdminLearningPanel /></LazyRoute></AdminRoute></ProtectedRoute> },
      { path: "/admin/words", element: <ProtectedRoute><AdminRoute><LazyRoute><AdminWordUpload /></LazyRoute></AdminRoute></ProtectedRoute> },
      { path: "/admin/people", element: <ProtectedRoute><AdminRoute><LazyRoute><AdminPeopleUpload /></LazyRoute></AdminRoute></ProtectedRoute> },
      // Catch-all route for 404
      { path: "*", element: <RouteErrorBoundary /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <RouterProvider router={router} />
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
