// Import our Task model
const Task = require('../models/Task');

// CREATE a new task under a specific project
const createTask = async (req, res) => {
    try {
        // Get task details from the request body
        const { title, status, dueDate, projectId } = req.body;

        // Create a new task document
        const newTask = new Task({
            title,
            status,           // if not provided, schema default 'todo' kicks in
            dueDate,
            project: projectId,      // links this task to a specific project
            assignedTo: req.user.id, // for now, auto-assign to whoever creates it
        });

        await newTask.save();

        res.status(201).json({
            message: 'Task created successfully',
            task: newTask,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET all tasks belonging to a specific project
const getTasksByProject = async (req, res) => {
    try {
        // req.params.projectId comes from the URL itself (we'll set this up in routes)
        // e.g. GET /api/tasks/project/12345 -> projectId = "12345"
        const { projectId } = req.params;

        // Find every task where 'project' matches this projectId
        const tasks = await Task.find({ project: projectId });

        res.status(200).json({ tasks });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// UPDATE a task's status (e.g. moving from 'todo' to 'in-progress')
const updateTaskStatus = async (req, res) => {
    try {
        // taskId comes from the URL, new status comes from the request body
        const { taskId } = req.params;
        const { status } = req.body;

        // Find the task by ID and update its status
        // { new: true } means: return the UPDATED document, not the old one
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { status },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({
            message: 'Task updated successfully',
            task: updatedTask,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DELETE a task
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Export all Four functions
module.exports = { createTask, getTasksByProject, updateTaskStatus, deleteTask };