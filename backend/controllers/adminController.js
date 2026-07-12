/**
 * File: controllers/adminController.js
 * Overall Purpose: Admin-exclusive dashboard data query endpoints.
 * Connections: Used by adminRoutes.js. Performs aggregated user audits.
 */

const prisma = require('../lib/prisma');

/**
 * Retrieves a list of all system users along with their total project count.
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { projects: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map database response to flatten the projects count structure
        const mappedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            projectCount: user._count.projects
        }));

        res.status(200).json({ users: mappedUsers });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getAllUsers };
