// Import our shared Prisma client instance
const prisma = require('../lib/prisma');

// Helper function to map Prisma project records to the exact JSON response shape of the old Mongoose schema
const mapProjectResponse = (project) => {
    if (!project) return null;
    return {
        id: project.id,
        title: project.title,
        description: project.description,
        owner: project.ownerId, // Map Prisma's "ownerId" foreign key to the "owner" field expected by the frontend
        ownerDetails: project.owner ? { name: project.owner.name, email: project.owner.email } : null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };
};

// CREATE a new project
const createProject = async (req, res) => {
    try {
        const { title, description } = req.body;

        // Create the project in PostgreSQL using Prisma
        // req.user.id is an integer injected by our protect middleware
        const newProject = await prisma.project.create({
            data: {
                title,
                description,
                ownerId: req.user.id,
            },
        });

        res.status(201).json({
            message: 'Project created successfully',
            project: mapProjectResponse(newProject),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET all projects (all for admin, user's own for standard user)
const getProjects = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';

        // Query projects
        const projects = await prisma.project.findMany({
            where: isAdmin ? {} : { ownerId: req.user.id },
            include: isAdmin ? { owner: { select: { name: true, email: true } } } : undefined,
            orderBy: { createdAt: 'desc' }, // Order by creation date descending
        });

        // Map the database records to the frontend-expected shapes
        res.status(200).json({
            projects: projects.map(mapProjectResponse),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// UPDATE a project's title/description
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        // Convert string ID from URL params to an integer, since our schema uses Int IDs
        const projectIdInt = parseInt(projectId, 10);
        const { title, description } = req.body;

        // Find the project first to verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectIdInt },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Enforce role-based authorization check
        if (req.user.role !== 'admin' && project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You do not own this project' });
        }

        // Perform update via Prisma
        const updatedProject = await prisma.project.update({
            where: { id: projectIdInt },
            data: { title, description },
        });

        res.status(200).json({
            message: 'Project updated',
            project: mapProjectResponse(updatedProject),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE a project
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        // Convert string ID from URL params to an integer
        const projectIdInt = parseInt(projectId, 10);

        // Find the project first to verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectIdInt },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Enforce role-based authorization check
        if (req.user.role !== 'admin' && project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You do not own this project' });
        }

        // Delete the project
        // Note: Task cascades are handled automatically by PostgreSQL due to schema "onDelete: Cascade"
        await prisma.project.delete({
            where: { id: projectIdInt },
        });

        res.status(200).json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createProject, getProjects, updateProject, deleteProject };