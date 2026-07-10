// Import express - we need this to create a "Router" (a mini set of routes)
const express = require('express');

// Create a router - think of this as a mini version of 'app' just for auth-related routes
const router = express.Router();

// Import the signup function we wrote in authController.js
const { signup, login, getProfile } = require('../controllers/authController');
// Import the middleware    
const protect = require('../middleware/authMiddleware');

// Define: when a POST request hits '/signup', run the signup function
// POST is used (not GET) because the user is SENDING data (name, email, password) to create something new
router.post('/signup', signup);

// Define: when a POST request hits '/login', run the login function
router.post('/login', login);

// 🔒 GET /auth/profile
// This route returns info about the CURRENTLY logged-in user
// It only works because our middleware already verified the token
// and attached req.user before this function even runs
router.get('/profile', protect, getProfile);

// Export this router so server.js can use it
module.exports = router;