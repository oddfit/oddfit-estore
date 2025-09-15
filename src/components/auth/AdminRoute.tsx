import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type Props = { children: React.ReactNode };

const AdminRoute: React.FC<Props> = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  // Still booting auth → show a tiny loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Not signed in → send to login, come back to /admin after OTP
  if (!currentUser || currentUser.isAnonymous) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Must be admin: either role === 'admin' or isAdmin === true on the user doc
  const isAdmin = userProfile?.role === 'admin' || userProfile?.isAdmin === true;
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
