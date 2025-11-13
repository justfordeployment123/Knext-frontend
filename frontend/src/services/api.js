/**
 * API Client - Frontend Only
 * Mock API service for frontend-only deployments
 * All requests return mock responses stored in localStorage
 */

import { getToken, removeToken, isTokenExpired } from './authService';

/**
 * Make authenticated API request (mock - no actual HTTP calls)
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

  // Return mock response - all data is stored in localStorage
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: null }),
    headers: new Headers({ 'Content-Type': 'application/json' })
  };
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
 * POST request (mock - stores data in localStorage)
 */
export const post = async (endpoint, data, options = {}) => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
  const result = await response.json();
  // Return the data that was posted (stored in localStorage by components)
  return { success: true, data: data };
};

/**
 * PUT request (mock - stores data in localStorage)
 */
export const put = async (endpoint, data, options = {}) => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
  const result = await response.json();
  // Return the data that was updated (stored in localStorage by components)
  return { success: true, data: data };
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
 * PATCH request (mock - stores data in localStorage)
 */
export const patch = async (endpoint, data, options = {}) => {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  const result = await response.json();
  // Return the data that was patched (stored in localStorage by components)
  return { success: true, data: data };
};

