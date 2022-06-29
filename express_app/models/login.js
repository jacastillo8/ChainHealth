let mongoose = require('mongoose');

// Login Schema
let loginSchema = mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    org: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: false
    },
    terminated: {
        type: String,
        required: true
    }
}, { collection: 'Logins' });

let Login = module.exports = mongoose.model('Login', loginSchema);