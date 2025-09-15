// src/routes/RequireAdmin.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, currentUser, isAdmin } = useAuth();
  const loc = useLocation();

  if (loading) return null; // or a spinner

  if (!currentUser) {
    const redirectTo = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
};

export default RequireAdmin;
