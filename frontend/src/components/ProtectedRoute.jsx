/**
 * File: src/components/ProtectedRoute.jsx
 * Overall Purpose: Route guard mapping to secure sections of the app (Dashboard, ProjectBoard).
 * Connections: Utilized by App.jsx to protect pages requiring authentic session context.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Premium full-page loading state showing custom visual design during auth hydration
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-16">
          <div className="w-48 h-48 border-t-2 border-brand rounded-full animate-spin"></div>
          <p className="text-textSecondary text-12 font-medium tracking-widest uppercase animate-pulse">
            Authenticating Session
          </p>
        </div>
      </div>
    );
  }

  // Redirect to Login if credentials are not set, storing the source location
  // to allow redirect back after successful sign-in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
