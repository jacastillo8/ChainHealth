let mongoose = require('mongoose');

// Timer Schema
let timerSchema = mongoose.Schema({
    exceptionRaised: {
        type: Boolean,
        required: true
    },
    inTransit: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    }
}, { collection: 'Transactions' });

let Timer = module.exports = mongoose.model('Timer', timerSchema);