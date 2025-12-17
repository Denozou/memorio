import { Navigate } from "react-router-dom";
import { type ReactNode, useEffect, useState } from "react";
import { isAuthenticated } from "../lib/auth";
import { useTranslation } from "react-i18next";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
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
    return <div>{t('common.loading')}</div>;
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return children;
}