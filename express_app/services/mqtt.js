const mqtt = require('mqtt');
const utils = require('./utils');

let Device = require('../models/device');
let map = {BP: 2, Temp: 1, SPO2: 0, Resp: 3}

async function validID() {
    let id, result
    while (true) {
        id = Math.floor((1 + Math.random()) * 0x1000000000).toString(16);
        result = await Device.find({ "clientID": id });
        if (result.length === 0) {
            return String(id);
        }
    }
}

// MQTT publish
function publish(options) {
    let client = mqtt.connect(utils.BrokerService(options.org), {clientId: "0000", rejectUnauthorized: false});
    client.on('connect', function() {
        console.log('Client 0000 connected: ' + client.connected);
        client.publish(options.topic, String(map[options.sensor]), {qos: 2});
        client.end();
    });
    client.on('error', function(err) {
        console.log(err);
    });
}

// MQTT subscribe 
function subscribe(options, callback) {
    let client = mqtt.connect(utils.BrokerService(options.org), {clientId: "ffff", rejectUnauthorized: false});
    client.on('connect', function() {
        console.log('Client ffff connected: ' + client.connected);
        client.subscribe(options.topic, {qos: 2});
    });
    client.on('message', function(topic, message) {
        if (topic.split('/').slice(-1)[0] in map) {
            client.end();
            callback({msg: message.toString(), 
                      sensor: topic.split('/').slice(-1)[0]});
        }
    });
    client.on('error', function(err) {
        console.log(err);
    });
}
// ------------------------------------------------------------------
/*function pub(topic) {
    client = mqtt.connect("mqtt://localhost:7883");
    client.on('connect', function() {
        console.log('Client connected: ' + client.connected);
        client.publish(topic, "122,150", {qos: 2});
        client.end();
    });
}
module.exports.pub = pub;*/
// ------------------------------------------------------------------

module.exports.publish = publish;
module.exports.subscribe = subscribe;
module.exports.validID = validID;
