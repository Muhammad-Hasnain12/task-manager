// Import express - lets us build the server and define routes
const express = require('express');

// Import cors - allows frontend (different port) to talk to this backend
const cors = require('cors');

// Import mongoose - lets us connect to and interact with MongoDB
const mongoose = require('mongoose');


const taskRoutes = require('./routes/taskRoutes');

// Import dotenv and immediately call .config()
require('dotenv').config();

// Import our route files
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');

// Create the express application
const app = express();

// Enable CORS so frontend can send requests here
app.use(cors());

// Allow the server to understand JSON data sent in requests
app.use(express.json());

// Connect to MongoDB using the connection string stored in .env
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((error) => {
        console.log('MongoDB connection failed:', error.message);
    });

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});