import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function useRequireAuth() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = !!currentUser; // no anonymous now
  const redirectTo = `${location.pathname}${location.search}`;

  const ensure = React.useCallback(() => {
    if (loading) return false; // caller can show spinner if they want
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, { replace: true });
      return false;
    }
    return true;
  }, [loading, isLoggedIn, navigate, redirectTo]);

  return { ensure, isLoggedIn, loading };
}
