// Import jwt - we need this to VERIFY tokens (not create them this time)
const jwt = require('jsonwebtoken');

// This is our middleware function
// Notice it takes THREE arguments: req, res, AND next
// 'next' is unique to middleware - calling it means "checks passed, let the request continue"
const protect = (req, res, next) => {
    try {
        // Get the Authorization header from the incoming request
        // Frontend will send it like: "Authorization: Bearer eyJhbGc..."
        const authHeader = req.headers.authorization;

        // If there's no header at all, or it doesn't start with "Bearer ", reject immediately
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // 401 = Unauthorized - means "you need to be logged in to do this"
            return res.status(401).json({ message: 'No token provided, access denied' });
        }

        // The header looks like "Bearer eyJhbGc..." - we only want the token part
        // split(' ') breaks it into ["Bearer", "eyJhbGc..."], we grab index [1]
        const token = authHeader.split(' ')[1];

        // Verify the token using our secret key
        // If someone tampered with it, or it's expired, this throws an error automatically
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // decoded now contains whatever we originally put in the token during login/signup
        // remember: jwt.sign({ userId: user._id }, ...) - so decoded.userId exists
        // We attach it to req.user so our actual controller functions can access "who's logged in"
        req.user = { id: decoded.userId };

        // Everything checked out - let the request continue to the actual controller
        next();

    } catch (error) {
        // This runs if jwt.verify() failed - meaning invalid or expired token
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Export so route files can use this to protect specific routes
module.exports = protect;