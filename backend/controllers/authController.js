// Import bcrypt - used to hash (scramble) passwords before saving
const bcrypt = require('bcryptjs');

// Import jwt - used to create login tokens
const jwt = require('jsonwebtoken');

// Import our User model - this is how we create/find users in MongoDB
const User = require('../models/User');

// This function handles user signup
// It's "async" because talking to the database takes time, and we need to wait for it
const signup = async (req, res) => {
    try {
        // req.body contains the data sent from the frontend (name, email, password)
        const { name, email, password } = req.body;

        // Check if a user with this email already exists in the database
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // 400 = "Bad Request" - tells frontend something was wrong with the input
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password before saving it
        // The '10' is the "salt rounds" - basically how many times it scrambles the password (10 is a safe default)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user document using our User model, with the HASHED password
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
        });

        // Actually save this user into MongoDB
        await newUser.save();

        // Create a JWT token for this new user
        // First argument = the data we want to store inside the token (just their ID)
        // Second argument = a secret key used to sign/verify the token (we'll add this to .env next)
        // Third argument = options, like when the token should expire
        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 201 = "Created" - tells frontend the signup worked
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });

    } catch (error) {
        // 500 = "Server Error" - something unexpected broke
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// This function handles user login
const login = async (req, res) => {
    try {
        // Get email and password sent from the frontend
        const { email, password } = req.body;

        // Look for a user with this email in the database
        const user = await User.findOne({ email });

        // If no user found with that email, reject login
        if (!user) {
            // 400 = Bad Request - we don't specify WHICH field is wrong (email vs password)
            // on purpose - this is a small security practice so attackers can't figure out
            // which emails exist in your system
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare the password they typed against the HASHED password stored in DB
        // bcrypt.compare() hashes the typed password the same way and checks if it matches
        // Note: we can never "un-hash" a password, we can only check if a fresh hash matches
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            // Same generic error message as above, for the same security reason
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // If we reach here, email + password are both correct
        // Create a new JWT token, exactly like we did in signup
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Send back the token + user info (never send back the password, even hashed)
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// This route returns info about the CURRENTLY logged-in user
// It only works because our middleware already verified the token
// and attached req.user before this function even runs
const getProfile = async (req, res) => {
    try {
        // req.user.id was set by our authMiddleware (from the decoded token)
        // We use it to find that exact user in the database
        // .select('-password') means "get everything EXCEPT the password field"
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Export this function so our routes file can use it
module.exports = { signup, login, getProfile };