/**
 * File: routes/adminRoutes.js
 * Overall Purpose: Routes for admin dashboard operations.
 * Connections: Mounted under /api/admin in server.js.
 */

const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');

// GET /api/admin/users - Returns list of users and project counts (Admin only)
router.get('/users', protect, requireAdmin, getAllUsers);

module.exports = router;
