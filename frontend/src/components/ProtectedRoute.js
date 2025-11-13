import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isAuthenticated, getCurrentUser } from '../services/authService';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { coachProfile, setCoachProfile } = useApp();
  const location = useLocation();

  useEffect(() => {
    // Check authentication and sync user profile
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user && !coachProfile) {
        // Sync user data to context
        setCoachProfile({
          name: user.fullName,
          email: user.email,
          team: user.teamName,
          division: user.division,
          offense: user.offensiveSystem,
          defense: user.defensiveSystem
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Strict authentication check - must have valid token
  if (!isAuthenticated()) {
    // Clear ALL stale data
    localStorage.removeItem('coachProfile');
    localStorage.removeItem('authToken');
    localStorage.removeItem('coachingBias');
    localStorage.removeItem('teamState');
    localStorage.removeItem('playerProfiles');
    localStorage.removeItem('recruitingState');
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Double-check: verify token is valid and user exists
  const user = getCurrentUser();
  if (!user) {
    // Token exists but is invalid - clear everything
    localStorage.removeItem('authToken');
    localStorage.removeItem('coachProfile');
    localStorage.removeItem('coachingBias');
    localStorage.removeItem('teamState');
    localStorage.removeItem('playerProfiles');
    localStorage.removeItem('recruitingState');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

