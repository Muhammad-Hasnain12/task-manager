// Import express - lets us build the server and define routes
const express = require('express');

// Import cors - allows frontend (different port) to talk to this backend
const cors = require('cors');

// Import dotenv and immediately call .config()
require('dotenv').config();

// Import our route files
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Create the express application
const app = express();

// Enable CORS so frontend can send requests here
app.use(cors());

// Allow the server to understand JSON data sent in requests
app.use(express.json());

// A simple test route to confirm the server itself is working
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Use PORT from .env if available, otherwise default to 5000
const PORT = process.env.PORT || 5000;

// Start the server only if we are not running in a production serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;