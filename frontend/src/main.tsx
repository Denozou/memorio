import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Login from "./routes/Login";
import SignUp from "./routes/SignUp";
import Dashboard from "./routes/Dashboard";
import Profile from "./routes/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";
import ExerciseWordLinking from "./routes/ExerciseWordLinking";
import ExerciseNamesFaces from "./routes/ExerciseNamesFaces";
import ExerciseNumberPeg from "./routes/ExerciseNumberPeg";
import OAuth2Success from "./routes/OAuth2Success";
import LearningHub from "./routes/LearningHub";
import ArticleDetail from "./routes/ArticleDetail";
import ArticleQuiz from "./routes/ArticleQuiz";
import AdminLearningPanel from "./routes/AdminLearningPanel";
import AdminRoute from "./routes/AdminRoute";
import VerifyEmail from "./routes/VerifyEmail";
import RequestPasswordReset from "./routes/RequestPasswordReset";
import ResetPassword from "./routes/ResetPassword";
import TwoFactorVerify from "./routes/TwoFactorVerify";
import TwoFactorSetup from "./routes/TwoFactorSetup";
import TwoFactorDisable from "./routes/TwoFactorDisable";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import "./i18n/config"; // Initialize i18n
import "./index.css";

import LandingPage from "./routes/LandingPage";
import IsoForestLeaderboard from "./routes/IsoForestLeaderboard";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/auth/oauth2/success", element: <OAuth2Success /> },
  { path: "/auth/verify-email", element: <VerifyEmail /> },
  { path: "/auth/forgot-password", element: <RequestPasswordReset /> },
  { path: "/auth/reset-password", element: <ResetPassword /> },
  { path: "/auth/2fa/verify", element: <TwoFactorVerify /> },
  { path: "/auth/2fa/setup", element: <ProtectedRoute><TwoFactorSetup /></ProtectedRoute> },
  { path: "/auth/2fa/disable", element: <ProtectedRoute><TwoFactorDisable /></ProtectedRoute> },
  { path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: "/profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
  { path: "/leaderboard", element: <ProtectedRoute><IsoForestLeaderboard /></ProtectedRoute> },
  { path: "/exercise/word-linking", element: <ProtectedRoute><ExerciseWordLinking /></ProtectedRoute> },
  { path: "/exercise/names-faces", element: <ProtectedRoute><ExerciseNamesFaces /></ProtectedRoute> },
  { path: "/exercise/number-peg", element: <ProtectedRoute><ExerciseNumberPeg /></ProtectedRoute> },
  { path: "/learning", element: <ProtectedRoute><LearningHub /></ProtectedRoute> },
  { path: "/learning/articles/:slug", element: <ProtectedRoute><ArticleDetail /></ProtectedRoute> },
  { path: "/learning/articles/:slug/quiz", element: <ProtectedRoute><ArticleQuiz /></ProtectedRoute> },
  { path: "/admin/learning", element: <ProtectedRoute><AdminRoute><AdminLearningPanel /></AdminRoute></ProtectedRoute> },
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