const express = require('express');
const router = express.Router();

// Import our task controller functions
const { createTask, getTasksByProject, updateTaskStatus, deleteTask } = require('../controllers/taskController');

// Import auth middleware - tasks must also be protected, only logged-in users can access
const protect = require('../middleware/authMiddleware');

// POST /api/tasks -> create a new task
router.post('/', protect, createTask);

// GET /api/tasks/project/:projectId -> get all tasks for a specific project
router.get('/project/:projectId', protect, getTasksByProject);

// PATCH /api/tasks/:taskId -> update a task's status
router.patch('/:taskId', protect, updateTaskStatus);

// DELETE /api/tasks/:taskId -> delete a task
router.delete('/:taskId', protect, deleteTask);

module.exports = router;