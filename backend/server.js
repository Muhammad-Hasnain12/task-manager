// Import express - lets us build the server and define routes
const express = require('express');

// Import cors - allows frontend (different port) to talk to this backend
const cors = require('cors');

// Import dotenv and immediately call .config()
// This reads your .env file and loads DATABASE_URL, JWT_SECRET, PORT etc. into process.env
require('dotenv').config();

// Import our route files - each handles a different group of endpoints
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Create the express application
// Note: unlike our old Mongoose setup, there's no explicit database "connect" step here.
// Prisma Client (imported inside lib/prisma.js and used by our controllers) connects
// automatically the first time a query actually runs - it manages its own connection pool.
const app = express();

// Enable CORS so frontend can send requests here
app.use(cors());

// Allow the server to understand JSON data sent in requests
app.use(express.json());

// A simple test route to confirm the server itself is working
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Register our route groups
// Any request starting with /api/auth is handled by authRoutes, and so on
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Use PORT from .env if available, otherwise default to 5000
const PORT = process.env.PORT || 5000;

// Start the server - it will now keep running and listening for requests
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});