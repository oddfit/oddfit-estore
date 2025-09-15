// src/routes/RequireAuth.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, currentUser } = useAuth();
  const loc = useLocation();
  if (loading) return null; // or spinner
  if (!currentUser) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
};

export default RequireAuth;
