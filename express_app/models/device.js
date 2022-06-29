let mongoose = require('mongoose');

let deviceSchema = mongoose.Schema({
    address: {
        type: String,
        required: true
    }, 
    client: {
        type: String,
        required: true
    },
    requestDate: {
        type: String,
        required: true
    },
    joinDate: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: false
    },
    authentication: {
        type: String,
        required: true
    },
    org: {
        type: String,
        required: true
    }
}, { collection: 'Devices' });

let Device = module.exports = mongoose.model('Device', deviceSchema);