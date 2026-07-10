// Import our Project model - lets us create/find/update/delete projects
const Project = require('../models/Project');

// CREATE a new project
const createProject = async (req, res) => {
    try {
        // Get title and description from the request body
        const { title, description } = req.body;

        // Create a new project document
        // req.user.id comes from our auth middleware - this is how we know WHO is creating it
        const newProject = new Project({
            title,
            description,
            owner: req.user.id,
        });

        // Save it to MongoDB
        await newProject.save();

        // 201 = Created
        res.status(201).json({
            message: 'Project created successfully',
            project: newProject,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET all projects belonging to the logged-in user
const getProjects = async (req, res) => {
    try {
        // Find every project where 'owner' matches the current logged-in user's ID
        // This ensures users only ever see THEIR OWN projects, not everyone's
        const projects = await Project.find({ owner: req.user.id });

        res.status(200).json({ projects });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// UPDATE a project's title/description
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description } = req.body;

        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            { title, description },
            { new: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json({ message: 'Project updated', project: updatedProject });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE a project
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const deletedProject = await Project.findByIdAndDelete(projectId);

        if (!deletedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.status(200).json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Export both functions so routes can use them
module.exports = { createProject, getProjects, updateProject, deleteProject };
