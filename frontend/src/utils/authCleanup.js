/**
 * Authentication Cleanup Utility
 * Clears all cached data if authentication is invalid
 */

import { isAuthenticated, getCurrentUser } from '../services/authService';

/**
 * Clear all application data from localStorage
 */
export const clearAllData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('coachProfile');
  localStorage.removeItem('coachingBias');
  localStorage.removeItem('teamState');
  localStorage.removeItem('playerProfiles');
  localStorage.removeItem('recruitingState');
};

/**
 * Validate authentication and clear data if invalid
 * Call this on app initialization
 */
export const validateAndCleanup = () => {
  // If no token or token is invalid, clear everything
  if (!isAuthenticated()) {
    clearAllData();
    return false;
  }

  // If token exists but user data is invalid, clear everything
  const user = getCurrentUser();
  if (!user) {
    clearAllData();
    return false;
  }

  return true;
};

