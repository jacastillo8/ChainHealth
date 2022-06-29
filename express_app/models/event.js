let mongoose = require('mongoose');

let eventSchema = mongoose.Schema({
    pid: {
        type: String,
        required: true
    },
    cid: {
        type: String,
        required: false
    },
    mid: {
        type: String,
        required: false
    },
    iid: {
        type: String,
        required: false
    },
    aid: {
        type: String,
        required: false
    },
    sid: {
        type: String,
        required: false
    },
    org: {
        type: String,
        required: true
    }
}, { collection: 'Events' });

let Event = module.exports = mongoose.model('Event', eventSchema);