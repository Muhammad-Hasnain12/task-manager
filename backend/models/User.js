// Import mongoose - we need this to define a schema
const mongoose = require('mongoose');

// A "schema" defines the structure/shape of a document in MongoDB
// Think of it like defining columns in a spreadsheet - what fields exist, and what type they are
const userSchema = new mongoose.Schema({
    name: {
        type: String,      // must be text
        required: true,    // cannot be empty - MongoDB will reject saving without it
    },
    email: {
        type: String,
        required: true,
        unique: true,       // no two users can have the same email
    },
    password: {
        type: String,
        required: true,     // we'll store the HASHED password here, never plain text
    },
}, {
    timestamps: true,     // automatically adds "createdAt" and "updatedAt" fields
});

// Turn the schema into an actual Model we can use to create/find/update users
// 'User' here is the name MongoDB will use to create a collection called "users"
const User = mongoose.model('User', userSchema);

// Export this so other files (like our routes) can use it
module.exports = User;