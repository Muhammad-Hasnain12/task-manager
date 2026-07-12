// Import bcrypt - used to hash passwords before saving
const bcrypt = require('bcryptjs');

// Import jwt - used to create login tokens
const jwt = require('jsonwebtoken');

// Import our shared Prisma client instance
const prisma = require('../lib/prisma');

// Handles user signup
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if a user with this email already exists
        // In Prisma, we use findUnique to query unique constraints (like email)
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password before saving it (same as before)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user record in PostgreSQL using Prisma
        // This replaces "new User({...}).save()"
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // Create a JWT token for the new user
        // Note: MongoDB's "_id" becomes Prisma's "id"
        const token = jwt.sign(
            { userId: newUser.id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Handles user login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password hash
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token using Prisma UUID "id"
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Returns profile of the currently logged-in user
const getProfile = async (req, res) => {
    try {
        // Find user by ID (supplied by protect middleware as req.user.id)
        // We use Prisma "select" to exclude the password field from the database query entirely
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { signup, login, getProfile };