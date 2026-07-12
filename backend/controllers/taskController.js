// Import our shared Prisma client instance
const prisma = require('../lib/prisma');

// Helper function to map Prisma task records to the exact JSON response shape of the old Mongoose schema
const mapTaskResponse = (task) => {
    if (!task) return null;
    return {
        id: task.id,
        title: task.title,
        status: task.status,
        project: task.projectId,        // Map projectId to "project"
        assignedTo: task.assignedToId,  // Map assignedToId to "assignedTo"
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
    };
};

// CREATE a new task under a specific project
const createTask = async (req, res) => {
    try {
        const { title, status, dueDate, projectId } = req.body;
        // Convert string projectId (from JSON body) to an integer, since our schema uses Int IDs
        const projectIdInt = parseInt(projectId, 10);

        // Find parent project to verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectIdInt },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Verify authorization
        if (req.user.role !== 'admin' && project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You do not own this project' });
        }

        // Create the task record
        const newTask = await prisma.task.create({
            data: {
                title,
                status: status || undefined, // if undefined, schema default "todo" will be used
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId: projectIdInt,
                assignedToId: req.user.id, // Auto-assign to task creator
            },
        });

        res.status(201).json({
            message: 'Task created successfully',
            task: mapTaskResponse(newTask),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET all tasks belonging to a specific project
const getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        // Convert string projectId (from URL params) to an integer
        const projectIdInt = parseInt(projectId, 10);

        // Find parent project to verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectIdInt },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Verify authorization
        if (req.user.role !== 'admin' && project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You do not own this project' });
        }

        // Query database using Prisma
        const tasks = await prisma.task.findMany({
            where: { projectId: projectIdInt },
            orderBy: { createdAt: 'asc' },
        });

        // Map all task objects in response
        res.status(200).json({
            tasks: tasks.map(mapTaskResponse),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// UPDATE a task's status
const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        // Convert string taskId (from URL params) to an integer
        const taskIdInt = parseInt(taskId, 10);
        const { status } = req.body;

        // Find the task and its parent project
        const task = await prisma.task.findUnique({
            where: { id: taskIdInt },
            include: { project: true },
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify authorization
        if (req.user.role !== 'admin' && task.project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You do not own this project' });
        }

        // Perform the update
        const updatedTask = await prisma.task.update({
            where: { id: taskIdInt },
            data: { status },
        });

        res.status(200).json({
            message: 'Task updated successfully',
            task: mapTaskResponse(updatedTask),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE a task
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        // Convert string taskId (from URL params) to an integer
        const taskIdInt = parseInt(taskId, 10);

        // Find the task and its parent project
        const task = await prisma.task.findUnique({
            where: { id: taskIdInt },
            include: { project: true },
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify authorization
        if (req.user.role !== 'admin' && task.project.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You do not own this project' });
        }

        // Perform the deletion
        await prisma.task.delete({
            where: { id: taskIdInt },
        });

        res.status(200).json({ message: 'Task deleted' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createTask, getTasksByProject, updateTaskStatus, deleteTask };