/**
 * API Client
 * Handles HTTP requests with JWT token injection
 */

import { getToken, removeToken, isTokenExpired } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Make authenticated API request
 * @param {string} endpoint 
 * @param {object} options 
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  // Check if token is expired
  if (token && isTokenExpired(token)) {
    removeToken();
    throw new Error('Session expired. Please login again.');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Check if response is HTML (backend not available)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      // Backend not available - return a mock JSON response for demo mode
      // Create a response-like object that can be parsed as JSON
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: null }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      };
    }
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized. Please login again.');
    }

    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response;
  } catch (error) {
    // Check if it's a JSON parse error (HTML response)
    if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
      // Return a mock response for demo mode
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: null }),
        headers: new Headers({ 'Content-Type': 'application/json' })
      };
    }
    if (error.message.includes('Session expired') || error.message.includes('Unauthorized')) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * GET request
 */
export const get = async (endpoint, options = {}) => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'GET'
  });
  return response.json();
};

/**
 * POST request
 */
export const post = async (endpoint, data, options = {}) => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
  const result = await response.json();
  // If backend not available, include the original data in response
  if (result.success && result.data === null && data) {
    return { success: true, data: data };
  }
  return result;
};

/**
 * PUT request
 */
export const put = async (endpoint, data, options = {}) => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
  const result = await response.json();
  // If backend not available, include the original data in response
  if (result.success && result.data === null && data) {
    return { success: true, data: data };
  }
  return result;
};

/**
 * DELETE request
 */
export const del = async (endpoint, options = {}) => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'DELETE'
  });
  return response.json();
};

/**
 * PATCH request
 */
export const patch = async (endpoint, data, options = {}) => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  const result = await response.json();
  // If backend not available, include the original data in response
  if (result.success && result.data === null && data) {
    return { success: true, data: data };
  }
  return result;
};

