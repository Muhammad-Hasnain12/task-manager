/**
 * File: src/services/api.js
 * Overall Purpose: Centralized Axios instance configuration and service layer.
 * Connections: Used by AuthContext and page components (Dashboard, ProjectBoard) 
 * to communicate with the Node.js/Express backend. Implements interceptors for 
 * token injection and global 401 handling.
 */

import axios from 'axios';

// Local module-level variable to store the JWT token in memory.
// This prevents it from being exposed to localStorage, mitigating XSS risks.
let inMemoryToken = null;

// Registry for a global logout callback handler to trigger React state clearing
// when a 401 Unauthorized is intercepted.
let onUnauthorizedCallback = null;

// Create centralized Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Sets or clears the in-memory JWT token.
 * @param {string|null} token - The signed JWT token or null to clear.
 */
export const setToken = (token) => {
  inMemoryToken = token;
};

/**
 * Registers a global callback for when a 401 Unauthorized response is received.
 * Allows the React AuthContext to handle user redirect and clean up state.
 * @param {function} callback - Callback function to run on unauthorized error.
 */
export const registerUnauthorizedHandler = (callback) => {
  onUnauthorizedCallback = callback;
};

// Request Interceptor: Automatically injects the Authorization header
// if a token is stored in memory.
api.interceptors.request.use(
  (config) => {
    // Only send token to our own backend base URL to prevent leakage to 3rd parties
    const isApiRequest = config.url && !config.url.startsWith('http') || config.url.startsWith(config.baseURL);
    
    if (inMemoryToken && isApiRequest) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Listens for 401 errors (e.g., token expired or invalid)
// and triggers the registered logout handler.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the response status is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Clear token and run the logout callback
      inMemoryToken = null;
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   AUTHENTICATION API CALLS
   ========================================================================== */

/**
 * Registers a new user.
 * @param {string} name - User's display name
 * @param {string} email - User's unique email address
 * @param {string} password - User's plain text password
 * @returns {Promise<object>} The response data containing user and token
 */
export const apiSignup = async (name, email, password) => {
  const response = await api.post('/api/auth/signup', { name, email, password });
  return response.data;
};

/**
 * Logs in an existing user.
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<object>} The response data containing user and token
 */
export const apiLogin = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

/**
 * Fetches the currently authenticated user's profile.
 * @returns {Promise<object>} Profile details
 */
export const apiGetProfile = async () => {
  const response = await api.get('/api/auth/profile');
  return response.data;
};

/* ==========================================================================
   PROJECTS API CALLS
   ========================================================================== */

/**
 * Retrieves all projects owned by the logged-in user.
 * @returns {Promise<object>} List of projects
 */
export const apiGetProjects = async () => {
  const response = await api.get('/api/projects');
  return response.data;
};

/**
 * Creates a new project.
 * @param {string} title - Project title
 * @param {string} description - Project description
 * @param {number|null} ownerId - Optional owner ID for admin overrides
 * @returns {Promise<object>} Created project details
 */
export const apiCreateProject = async (title, description, ownerId) => {
  const response = await api.post('/api/projects', { title, description, ownerId });
  return response.data;
};

/**
 * Updates a project.
 * @param {string} projectId - Database ID of the project
 * @param {string} title - New project title
 * @param {string} description - New project description
 * @returns {Promise<object>} Updated project details
 */
export const apiUpdateProject = async (projectId, title, description) => {
  const response = await api.put(`/api/projects/${projectId}`, { title, description });
  return response.data;
};

/**
 * Deletes a project.
 * @param {string} projectId - Database ID of the project
 * @returns {Promise<object>} Confirmation message
 */
export const apiDeleteProject = async (projectId) => {
  const response = await api.delete(`/api/projects/${projectId}`);
  return response.data;
};

/* ==========================================================================
   TASKS API CALLS
   ========================================================================== */

/**
 * Fetches all tasks for a specific project.
 * @param {string} projectId - Database ID of the project
 * @returns {Promise<object>} List of tasks
 */
export const apiGetTasks = async (projectId) => {
  const response = await api.get(`/api/tasks/project/${projectId}`);
  return response.data;
};

/**
 * Creates a new task.
 * @param {string} title - Task name
 * @param {string} status - Initial status ('todo', 'in-progress', 'done')
 * @param {string|null} dueDate - Task due date string
 * @param {string} projectId - ID of the project it belongs to
 * @returns {Promise<object>} Created task details
 */
export const apiCreateTask = async (title, status, dueDate, projectId) => {
  const response = await api.post('/api/tasks', { title, status, dueDate, projectId });
  return response.data;
};

/**
 * Updates a task's status.
 * @param {string} taskId - Database ID of the task
 * @param {string} status - New status ('todo', 'in-progress', 'done')
 * @returns {Promise<object>} Updated task details
 */
export const apiUpdateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/api/tasks/${taskId}`, { status });
  return response.data;
};

/**
 * Deletes a task.
 * @param {string} taskId - Database ID of the task
 * @returns {Promise<object>} Confirmation message
 */
export const apiDeleteTask = async (taskId) => {
  const response = await api.delete(`/api/tasks/${taskId}`);
  return response.data;
};

/* ==========================================================================
   ADMIN API CALLS
   ========================================================================== */

/**
 * Fetches all registered users (admin audit tool).
 * @returns {Promise<object>} User list
 */
export const apiGetAdminUsers = async () => {
  const response = await api.get('/api/admin/users');
  return response.data;
};

export default api;
