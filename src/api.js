/**
 * Central API Client
 * Single BASE_URL constant used across all frontend API calls.
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const handleResponse = async (response) => {
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

/**
 * Fetch all tasks
 * @returns {Promise<Array>} List of tasks
 */
export const fetchTasks = async () => {
  const response = await fetch(`${BASE_URL}/tasks`);
  return handleResponse(response);
};

/**
 * Create a new task
 * @param {Object} taskData - { title, description }
 * @returns {Promise<Object>} Created task from MongoDB
 */
export const createTask = async (taskData) => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  return handleResponse(response);
};

/**
 * Update an existing task
 * @param {string} id - MongoDB Task _id
 * @param {Object} updates - { title, description, completed }
 * @returns {Promise<Object>} Updated task from MongoDB
 */
export const updateTask = async (id, updates) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
};

/**
 * Delete a task
 * @param {string} id - MongoDB Task _id
 * @returns {Promise<Object>} Deletion confirmation { message, id }
 */
export const deleteTask = async (id) => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};
