const express = require('express');
const path = require('path');
const fs = require('fs');
const mqtt = require('../services/mqtt');
const utils = require('../services/utils');

const router = express.Router();

let status = { pending: "1", approved: "0", rejected: "-1" };
let Device = require('../models/device');

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

// Device Manager panel - data visulization
router.get('/', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else if (res.locals.role.indexOf('healthcare') === -1) {
        res.redirect('/');
    } else {
        let approved = [];
        let rejected = [];
        let pending = []
        Device.find({}, null, {sort:{authentication: -1}}, function(err, devices) {
            if (err) {
                console.log(err);
            }
            for (let i=0; i < devices.length; i++) {
                if (devices[i].authentication === status['pending']) {
                    pending.push(devices[i]);
                } 
            }
            Device.find({ "org": utils.getName(res.locals.org) }, null, {sort:{authentication: -1}}, function(err, locals) {
                if (err) {
                    console.log(err);
                }
                for (let j=0; j < locals.length; j++) {
                    if (locals[j].authentication === status['approved']) {
                        approved.push(locals[j]);
                    } else if (locals[j].authentication === status['rejected']) {
                        rejected.push(locals[j]);
                    }
                }
                res.render('mqtt_setup', {
                    approved: approved,
                    rejected: rejected,
                    pending: pending,
                    devices: true
                });
            });

        });
    }
})

// Add new devices pending approval
router.post('/add', function(req, res) {
    let address = req.body.mac;
    let current_status = "";
    if (address.split(':').length === 6) {
        let flag = false;
        for (let i=0; i < address.split(':').length; i++) {
            if (address.split(':')[i].length !== 2) {
                flag = true;
                break;
            }
        }
        if (!flag) {
            Device.find({ "address": address.toLowerCase() }, ["authentication", "org", "client"], async function(err, devices) {
                if (err) {
                    console.log(err);
                } else if (devices.length === 0) {
                    current_status = getKeyByValue(status, status['pending']);
                    let device = new Device();
                    device.address = address.toLowerCase();
                    device.client = await mqtt.validID();
                    device.requestDate = Date.now();
                    device.joinDate = '-';
                    device.location = null;
                    device.authentication = status['pending'];
                    device.org = '-';
                    device.save(function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                } else if (devices.length === 1) {
                    current_status = getKeyByValue(status, devices[0].authentication);
                    if (current_status === 'approved') {
                        let cert = fs.readFileSync(path.join(__dirname, '../mqtt', utils.BrokerCert(devices[0].org)));
                        let broker = utils.BrokerService(utils.getDomain(devices[0].org));
                        let string = broker.substring(broker.lastIndexOf("/") + 1);
                        res.json({status: current_status, ccp: {host: string.split(':')[0], port: string.split(':')[1]}, user: devices[0].client, pem: cert.toString()});
                        return;
                    }
                }
                res.status(201).json({ status: current_status });
            });
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(403);
    }
});

// Update devices from panel (approve/reject)
router.post('/update/:client/:address', function(req, res) {
    if (typeof req.session.user === 'undefined' || req.session.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else if (req.session.role.indexOf('healthcare') === -1) {
        res.redirect('/');
    } else {
        let address = req.params.address;
        let client = req.params.client.replace(/[^a-zA-Z0-9]/g, "");
        let location = req.body.loc;
        let authentication = req.body.auth;
        Device.findOne({ "address": address, "client": client }, function(err, device) {
            if (err) {
                console.log(err);
            }
            device.joinDate = Date.now();
            device.location = location;
            device.authentication = authentication;
            device.org = utils.getName(req.session.org);
            device.save(function(err) {
                if (err) {
                    console.log(err);
                }
                res.status(201).json({});
            });
        })
    }
});

// Remove devices from panel
router.post('/remove/:client/:address', function(req, res) {
    if (typeof req.session.user === 'undefined' || req.session.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else if (req.session.role.indexOf('healthcare') === -1) {
        res.redirect('/');
    } else {
        let address = req.params.address;
        let client = req.params.client.replace(/[^a-zA-Z0-9]/g, "");
        Device.findOneAndRemove({ "address": address, "client": client, "org": utils.getName(req.session.org) }, function(err, response) {
            res.status(200).json({});
        });
    }
})

// Send and receive MQTT data
router.get('/:device/:sensor/:pid', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else if (res.locals.role.indexOf('healthcare') === -1) {
        res.redirect('/');
    } else {
        let sub = 'mysignals/' + req.params.device + '/' + req.params.pid + '/#';
        let pub = 'mysignals/sensors/' + req.params.device + '/' + req.params.pid;
        mqtt.subscribe({ topic: sub, org: res.locals.org }, function(values) {
            res.send(values);
        });
        mqtt.publish({ topic: pub, sensor: req.params.sensor, org: res.locals.org });
    }
})

module.exports = router;