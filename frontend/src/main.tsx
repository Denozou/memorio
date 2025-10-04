import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Login from "./routes/Login";
import SignUp from "./routes/SignUp";
import Dashboard from "./routes/Dashboard";
import Profile from "./routes/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";
import ExerciseImageLinking from "./routes/ExerciseImageLinking";
import OAuth2Success from "./routes/OAuth2Success";
import "./index.css";

import LandingPage from "./routes/LandingPage";
const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/auth/oauth2/success", element: <OAuth2Success /> },
  { path: "/landing", element: <LandingPage /> },
  { path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: "/profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
  { path: "/exercise/image-linking", element: <ProtectedRoute><ExerciseImageLinking /></ProtectedRoute> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
);