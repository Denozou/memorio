import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import "./i18n/config"; // Initialize i18n
import "./index.css";

// Eagerly load critical routes
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";

// Lazy load all page components for code-splitting
const LandingPage = lazy(() => import("./routes/LandingPage"));
const Login = lazy(() => import("./routes/Login"));
const SignUp = lazy(() => import("./routes/SignUp"));
const Dashboard = lazy(() => import("./routes/Dashboard"));
const Profile = lazy(() => import("./routes/Profile"));
const OAuth2Success = lazy(() => import("./routes/OAuth2Success"));
const VerifyEmail = lazy(() => import("./routes/VerifyEmail"));
const RequestPasswordReset = lazy(() => import("./routes/RequestPasswordReset"));
const ResetPassword = lazy(() => import("./routes/ResetPassword"));
const TwoFactorVerify = lazy(() => import("./routes/TwoFactorVerify"));
const TwoFactorSetup = lazy(() => import("./routes/TwoFactorSetup"));
const TwoFactorDisable = lazy(() => import("./routes/TwoFactorDisable"));
const ExerciseWordLinking = lazy(() => import("./routes/ExerciseWordLinking"));
const ExerciseNamesFaces = lazy(() => import("./routes/ExerciseNamesFaces"));
const ExerciseNumberPeg = lazy(() => import("./routes/ExerciseNumberPeg"));
const LearningHub = lazy(() => import("./routes/LearningHub"));
const ArticleDetail = lazy(() => import("./routes/ArticleDetail"));
const ArticleQuiz = lazy(() => import("./routes/ArticleQuiz"));
const AdminLearningPanel = lazy(() => import("./routes/AdminLearningPanel"));
const AdminWordUpload = lazy(() => import("./routes/AdminWordUpload"));
const AdminPeopleUpload = lazy(() => import("./routes/AdminPeopleUpload"));
const IsoForestLeaderboard = lazy(() => import("./routes/IsoForestLeaderboard"));

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
    children: [
      { path: "/", element: <LazyRoute><LandingPage /></LazyRoute> },
      { path: "/login", element: <LazyRoute><Login /></LazyRoute> },
      { path: "/signup", element: <LazyRoute><SignUp /></LazyRoute> },
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
      { path: "/admin/people", element: <ProtectedRoute><AdminRoute><LazyRoute><AdminPeopleUpload /></LazyRoute></AdminRoute></ProtectedRoute> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
