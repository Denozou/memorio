import { Navigate } from "react-router-dom";
import { type ReactNode, useEffect, useState } from "react";
import { isAuthenticated } from "../lib/auth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setAuthStatus(authenticated ? 'authenticated' : 'unauthenticated');
    };

    checkAuth();
  }, []);

  if (authStatus === 'loading') {
    // Show loading spinner or placeholder while checking authentication
    return <div>Loading...</div>;
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}