// Import mongoose to define our schema
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        // enum = only these exact values are allowed, anything else gets rejected
        enum: ['todo', 'in-progress', 'done'],
        default: 'todo',   // if not specified, new tasks start as 'todo'
    },
    // Links this task to the Project it belongs to
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    // Links this task to the User it's assigned to
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,   // optional - a task can exist unassigned
    },
    dueDate: {
        type: Date,
        required: false,
    },
}, {
    timestamps: true,
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;