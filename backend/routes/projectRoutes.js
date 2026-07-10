const express = require('express');
const router = express.Router();

// Import our project controller functions
const { createProject, getProjects, updateProject, deleteProject } = require('../controllers/projectController');

// Import our auth middleware - EVERY project route needs to be protected,
// since projects belong to specific logged-in users
const protect = require('../middleware/authMiddleware');

// POST /api/projects -> create a new project (must be logged in)
router.post('/', protect, createProject);

// GET /api/projects -> get all projects for the logged-in user
router.get('/', protect, getProjects);

// PUT /api/projects/:projectId -> update a project
router.put('/:projectId', protect, updateProject);

// DELETE /api/projects/:projectId -> delete a project
router.delete('/:projectId', protect, deleteProject);

module.exports = router;