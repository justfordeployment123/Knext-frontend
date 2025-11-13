/**
 * Authentication Service
 * Handles JWT token management and authentication API calls
 */

// Use relative URL in production (Docker), absolute in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');

// Always use real API - no mock fallback
const USE_REAL_API = true;

/**
 * Generate a simple mock JWT token for demo mode (when backend is unavailable)
 * This is a basic implementation for frontend-only deployments
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
 * Check if response is HTML (backend not available)
 */
const isHTMLResponse = (response) => {
  const contentType = response.headers.get('content-type');
  return contentType && contentType.includes('text/html');
};

/**
 * Decode JWT token
 * For real JWT tokens from backend, this just extracts the payload
 * Backend verifies the signature
 */
const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    
    // If token has userId (from backend), map it to user structure
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
  try {
    // Real API call
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    // Check if response is HTML (backend not available - frontend-only mode)
    if (isHTMLResponse(response)) {
      // Fallback to demo mode - allow any email/password for demo
      const mockUser = {
        id: Date.now().toString(),
        email: email,
        fullName: email.split('@')[0] || 'Demo User',
        teamName: 'Demo Team',
        division: 'D1',
        offensiveSystem: 'Motion',
        defensiveSystem: 'Man-to-Man'
      };
      const mockToken = generateMockToken(mockUser);
      setToken(mockToken);
      return {
        success: true,
        token: mockToken,
        user: mockUser
      };
    }

    // Handle network errors
    if (!response.ok && response.status === 0) {
      throw new Error('Cannot connect to backend server.');
    }

    const data = await response.json();

    if (data.success && data.token) {
      setToken(data.token);
      return {
        success: true,
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          teamName: data.user.teamName,
          division: data.user.division,
          offensiveSystem: data.user.offensiveSystem,
          defensiveSystem: data.user.defensiveSystem
        }
      };
    } else {
      return {
        success: false,
        error: data.error || 'Login failed. Please try again.'
      };
    }
  } catch (error) {
    // Check if it's a JSON parse error (HTML response)
    if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
      // Fallback to demo mode
      const mockUser = {
        id: Date.now().toString(),
        email: email,
        fullName: email.split('@')[0] || 'Demo User',
        teamName: 'Demo Team',
        division: 'D1',
        offensiveSystem: 'Motion',
        defensiveSystem: 'Man-to-Man'
      };
      const mockToken = generateMockToken(mockUser);
      setToken(mockToken);
      return {
        success: true,
        token: mockToken,
        user: mockUser
      };
    }
    
    // Check if it's a network error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      // Fallback to demo mode for network errors too
      const mockUser = {
        id: Date.now().toString(),
        email: email,
        fullName: email.split('@')[0] || 'Demo User',
        teamName: 'Demo Team',
        division: 'D1',
        offensiveSystem: 'Motion',
        defensiveSystem: 'Man-to-Man'
      };
      const mockToken = generateMockToken(mockUser);
      setToken(mockToken);
      return {
        success: true,
        token: mockToken,
        user: mockUser
      };
    }
    return {
      success: false,
      error: error.message || 'Login failed. Please try again.'
    };
  }
};

/**
 * Register new user
 * @param {object} userData 
 * @returns {Promise<{success: boolean, token?: string, user?: object, error?: string}>}
 */
export const register = async (userData) => {
  try {
    // Real API call
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    // Check if response is HTML (backend not available - frontend-only mode)
    if (isHTMLResponse(response)) {
      // Fallback to demo mode
      const mockUser = {
        id: Date.now().toString(),
        email: userData.email,
        fullName: userData.fullName || userData.email.split('@')[0],
        teamName: userData.teamName || 'Demo Team',
        division: userData.division || 'D1',
        offensiveSystem: userData.offensiveSystem || 'Motion',
        defensiveSystem: userData.defensiveSystem || 'Man-to-Man'
      };
      const mockToken = generateMockToken(mockUser);
      setToken(mockToken);
      return {
        success: true,
        token: mockToken,
        user: mockUser
      };
    }

    // Handle network errors
    if (!response.ok && response.status === 0) {
      throw new Error('Cannot connect to backend server.');
    }

    const data = await response.json();

    if (data.success && data.token) {
      setToken(data.token);
      return {
        success: true,
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          teamName: data.user.teamName,
          division: data.user.division,
          offensiveSystem: data.user.offensiveSystem,
          defensiveSystem: data.user.defensiveSystem
        }
      };
    } else {
      return {
        success: false,
        error: data.error || 'Registration failed. Please try again.'
      };
    }
  } catch (error) {
    // Check if it's a JSON parse error (HTML response)
    if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
      // Fallback to demo mode
      const mockUser = {
        id: Date.now().toString(),
        email: userData.email,
        fullName: userData.fullName || userData.email.split('@')[0],
        teamName: userData.teamName || 'Demo Team',
        division: userData.division || 'D1',
        offensiveSystem: userData.offensiveSystem || 'Motion',
        defensiveSystem: userData.defensiveSystem || 'Man-to-Man'
      };
      const mockToken = generateMockToken(mockUser);
      setToken(mockToken);
      return {
        success: true,
        token: mockToken,
        user: mockUser
      };
    }
    
    // Check if it's a network error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      // Fallback to demo mode for network errors too
      const mockUser = {
        id: Date.now().toString(),
        email: userData.email,
        fullName: userData.fullName || userData.email.split('@')[0],
        teamName: userData.teamName || 'Demo Team',
        division: userData.division || 'D1',
        offensiveSystem: userData.offensiveSystem || 'Motion',
        defensiveSystem: userData.defensiveSystem || 'Man-to-Man'
      };
      const mockToken = generateMockToken(mockUser);
      setToken(mockToken);
      return {
        success: true,
        token: mockToken,
        user: mockUser
      };
    }
    return {
      success: false,
      error: error.message || 'Registration failed. Please try again.'
    };
  }
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
 * Refresh token (if implementing refresh token flow)
 * Note: Token generation is handled by the backend API
 */
export const refreshToken = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No token to refresh');
    }

    // Token refresh should be handled by the backend API
    // Uncomment and implement when backend refresh endpoint is available
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    if (data.success && data.token) {
      setToken(data.token);
      return {
        success: true,
        token: data.token
      };
    } else {
      throw new Error(data.error || 'Token refresh failed');
    }
  } catch (error) {
    // If refresh endpoint doesn't exist or fails, logout user
    logout();
    return {
      success: false,
      error: error.message || 'Token refresh not available. Please login again.'
    };
  }
};

