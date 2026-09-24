/**
 * Central API Client
 * Single BASE_URL constant used across all frontend API calls.
 * Manages JWT authentication tokens and protected HTTP headers.
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let authToken = localStorage.getItem('task_manager_token') || null;
let onUnauthorizedCallback = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('task_manager_token', token);
  } else {
    localStorage.removeItem('task_manager_token');
  }
};

export const getAuthToken = () => authToken;

export const setOnUnauthorized = (callback) => {
  onUnauthorizedCallback = callback;
};

const getHeaders = (hasBody = false) => {
  const headers = {};
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Keep default error message if JSON parsing fails
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

/* ==========================================================================
   Authentication Endpoints
   ========================================================================== */

/**
 * Register a new user
 * @param {Object} credentials - { email, password }
 */
export const registerUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

/**
 * Login user and store token
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await handleResponse(response);
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};

/**
 * Get current logged in user details
 */
export const fetchMe = async () => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

/**
 * Logout user
 */
export const logoutUser = () => {
  setAuthToken(null);
};

/* ==========================================================================
   Protected Task Endpoints
   ========================================================================== */

/**
 * Fetch all tasks for the logged-in user
 */
export const fetchTasks = async () => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

/**
 * Create a new task
 * @param {Object} taskData - { title, description }
 */
export const createTask = async (taskData) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(taskData),
  });
  return handleResponse(response);
};

/**
 * Update an existing task
 * @param {string} id - MongoDB Task _id
 * @param {Object} updates - { title, description, completed }
 */
export const updateTask = async (id, updates) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
};

/**
 * Delete a task
 * @param {string} id - MongoDB Task _id
 */
export const deleteTask = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch a single task by ID (GET /tasks/:id)
 * @param {string} id - MongoDB Task _id
 */
export const fetchTaskById = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

/**
 * Fetch in-memory cache statistics (GET /tasks/cache/stats)
 */
export const fetchCacheStats = async () => {
  const response = await fetch(`${BASE_URL}/tasks/cache/stats`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return handleResponse(response);
};

