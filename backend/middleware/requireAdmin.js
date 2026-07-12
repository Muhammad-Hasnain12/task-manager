/**
 * File: middleware/requireAdmin.js
 * Overall Purpose: Role verification middleware to allow access only to 'admin' users.
 * Connections: Used on routes that require administrator privileges. Must be placed
 * after the 'protect' authentication middleware.
 */

const requireAdmin = (req, res, next) => {
    // Check if user is authenticated and has the admin role
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        // 403 = Forbidden - means "authenticated but does not have permission"
        res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
};

module.exports = requireAdmin;
