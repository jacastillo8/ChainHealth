let mongoose = require('mongoose');

// Transaction Schema
let transactionSchema = mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    eid: {
        type: String,
        required: false
    },
    pid: {
        type: String,
        required: true
    },
    org: {
        type: String,
        required: true
    }
}, { collection: 'Health_Transactions' });

let Transaction = module.exports = mongoose.model('Health_Transaction', transactionSchema);