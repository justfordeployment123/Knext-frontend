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
  return response.json();
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
  return response.json();
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
  return response.json();
};

