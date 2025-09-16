import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Login from "./routes/Login";
import Dashboard from "./routes/Dashboard";
import Profile from "./routes/Profile";
import ProtectedRoute from "./routes/ProtectedRoute";
import ExerciseImageLinking from "./routes/ExerciseImageLinking";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <Login /> },
  { path: "/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: "/profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
  { path: "/exercise/image-linking", element: <ProtectedRoute><ExerciseImageLinking /></ProtectedRoute> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
);