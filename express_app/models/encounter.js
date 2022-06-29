let mongoose = require('mongoose');

let encounterSchema = mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    pid: {
        type: String,
        required: true
    },
    vid: {
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
    }
}, { collection: 'Encounters' });

let Encounter = module.exports = mongoose.model('Encounter', encounterSchema);