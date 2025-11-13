/**
 * Authentication Service - Frontend Only
 * Handles JWT token management using localStorage
 * No backend API calls - all authentication is client-side
 */

/**
 * Generate a JWT token for frontend-only authentication
 * All authentication is handled client-side using localStorage
 */
const generateMockToken = (userData) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    userId: userData.id || Date.now().toString(),
    email: userData.email,
    fullName: userData.fullName,
    teamName: userData.teamName || 'Demo Team',
    division: userData.division || 'D1',
    offensiveSystem: userData.offensiveSystem || 'Motion',
    defensiveSystem: userData.defensiveSystem || 'Man-to-Man',
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    iat: Math.floor(Date.now() / 1000)
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};


/**
 * Decode JWT token
 * Extracts the payload from the token
 */
const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    
    // If token has userId, map it to user structure
    if (payload.userId) {
      return {
        user: {
          id: payload.userId,
          email: payload.email,
          fullName: payload.fullName,
          teamName: payload.teamName,
          division: payload.division,
          offensiveSystem: payload.offensiveSystem,
          defensiveSystem: payload.defensiveSystem
        },
        exp: payload.exp,
        iat: payload.iat
      };
    }
    
    return payload;
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  const payload = decodeToken(token);
  if (!payload) return true;
  
  // Check expiration (exp is in seconds, Date.now() is in milliseconds)
  if (payload.exp) {
    return Date.now() >= payload.exp * 1000;
  }
  
  // If no exp field, assume expired (invalid token)
  return true;
};

/**
 * Store token in localStorage
 */
export const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

/**
 * Get token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem('authToken');
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('authToken');
};

/**
 * Get current user from token
 */
export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    removeToken();
    return null;
  }
  
  const payload = decodeToken(token);
  if (!payload) return null;
  
  // Handle both mock and real JWT token structures
  return payload.user || {
    id: payload.userId,
    email: payload.email,
    fullName: payload.fullName,
    teamName: payload.teamName,
    division: payload.division,
    offensiveSystem: payload.offensiveSystem,
    defensiveSystem: payload.defensiveSystem
  };
};

/**
 * Check if user is authenticated
 * Strict check: token must exist, be valid, and not expired
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) {
    // No token - clear any stale profile data
    localStorage.removeItem('coachProfile');
    return false;
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    // Token expired - clear everything
    removeToken();
    localStorage.removeItem('coachProfile');
    return false;
  }
  
  // Verify token has valid user data
  const user = getCurrentUser();
  if (!user) {
    // Token exists but user data is invalid - clear everything
    removeToken();
    localStorage.removeItem('coachProfile');
    return false;
  }
  
  return true;
};

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, token?: string, user?: object, error?: string}>}
 */
export const login = async (email, password) => {
  // Frontend-only authentication - no backend API calls
  // Allow any email/password for demo purposes
  const user = {
    id: Date.now().toString(),
    email: email,
    fullName: email.split('@')[0] || 'Demo User',
    teamName: 'Demo Team',
    division: 'D1',
    offensiveSystem: 'Motion',
    defensiveSystem: 'Man-to-Man'
  };
  const token = generateMockToken(user);
  setToken(token);
  return {
    success: true,
    token: token,
    user: user
  };
};

/**
 * Register new user
 * @param {object} userData 
 * @returns {Promise<{success: boolean, token?: string, user?: object, error?: string}>}
 */
export const register = async (userData) => {
  // Frontend-only authentication - no backend API calls
  const user = {
    id: Date.now().toString(),
    email: userData.email,
    fullName: userData.fullName || userData.email.split('@')[0],
    teamName: userData.teamName || 'Demo Team',
    division: userData.division || 'D1',
    offensiveSystem: userData.offensiveSystem || 'Motion',
    defensiveSystem: userData.defensiveSystem || 'Man-to-Man'
  };
  const token = generateMockToken(user);
  setToken(token);
  return {
    success: true,
    token: token,
    user: user
  };
};

/**
 * Logout user
 */
export const logout = () => {
  removeToken();
  localStorage.removeItem('coachProfile');
  localStorage.removeItem('coachingBias');
  localStorage.removeItem('teamState');
  localStorage.removeItem('playerProfiles');
  localStorage.removeItem('recruitingState');
};

/**
 * Refresh token - Frontend only
 * Generates a new token with extended expiration
 */
export const refreshToken = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('No token to refresh');
  }

  const user = getCurrentUser();
  if (!user) {
    logout();
    return {
      success: false,
      error: 'Invalid token. Please login again.'
    };
  }

  // Generate new token with extended expiration
  const newToken = generateMockToken(user);
  setToken(newToken);
  return {
    success: true,
    token: newToken
  };
};

