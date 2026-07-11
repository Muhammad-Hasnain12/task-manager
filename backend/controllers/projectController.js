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
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };
};

// CREATE a new project
const createProject = async (req, res) => {
    try {
        const { title, description } = req.body;

        // Create the project in PostgreSQL using Prisma
        // req.user.id is a UUID injected by our protect middleware
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

// GET all projects belonging to the logged-in user
const getProjects = async (req, res) => {
    try {
        // Query projects owned by the currently authenticated user
        const projects = await prisma.project.findMany({
            where: { ownerId: req.user.id },
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
        const { title, description } = req.body;

        // Perform atomic update via Prisma
        // If a project is not found with that ID, Prisma throws a P2025 error which is caught in catch block
        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: { title, description },
        });

        res.status(200).json({
            message: 'Project updated',
            project: mapProjectResponse(updatedProject),
        });
    } catch (error) {
        // Handle RecordNotFound specifically to return 404 (same behavior as Mongoose)
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE a project
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Delete the project
        // Note: Task cascades are handled automatically by PostgreSQL due to schema "onDelete: Cascade"
        await prisma.project.delete({
            where: { id: projectId },
        });

        res.status(200).json({ message: 'Project deleted' });
    } catch (error) {
        // Handle RecordNotFound for 404 response
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createProject, getProjects, updateProject, deleteProject };
