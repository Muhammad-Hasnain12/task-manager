// Import mongoose to define our schema
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,   // every project must have a name
    },
    description: {
        type: String,
        required: false,  // optional - projects can exist without a description
    },
    // This links a Project to the User who created it
    // 'ObjectId' is MongoDB's special ID type - basically a pointer to another document
    // 'ref: User' tells Mongoose this ID points to a document in the User collection
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,   // adds createdAt/updatedAt automatically
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;