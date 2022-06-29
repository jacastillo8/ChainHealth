let mongoose = require('mongoose');

// User schema
let userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    org: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
}, { collection: 'Users' });

let User = module.exports = mongoose.model('User', userSchema);