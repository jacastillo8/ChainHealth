const axios = require('axios');
const jwt = require('jsonwebtoken');
const utils = require('./utils');

// Import model
let Login = require('../models/login');
let Timer = require('../models/timer');

// Query single type in blockchain function
async function query(org, type, keys) {
    let request = {
        requestor: await getUsers(org),
        message: {
            method: 'query',
            args: {
                type: type,
                range: keys
            }
        }
    };
    let bc = utils.BCService();
    let res = await axios.post(`${bc}/evaluate`, request);
    return res.data.result;
}

// Query all types in blockchain function
async function queryAll(org, type, keys) {
    let request = {
        requestor: await getUsers(org),
        message: {
            method: 'queryAllTypes',
            args: {
                types: type,
                ranges: keys
            }
        }
    };
    let bc = utils.BCService();
    let res = await axios.post(`${bc}/evaluate`, request);
    return res.data.result;
}

// Invoke blockchain function
async function invoke(org, txID, type, data) {
    let request = {
        requestor: await getUsers(org),
        message: {
            method: 'addTX',
            args: {
                id: txID,
                type: type
            },
            data
        }
    };
    let bc = utils.BCService();
    await axios.post(`${bc}/insert`, request);
}

async function sendInvoke(org, type, txID, data, callback) {
    try {
        let start = Date.now();
        await invoke(org, txID, type, data);
        let end = Date.now() - start;
        let timer = new Timer({ exceptionRaised: false, inTransit: end, type: 'insert' });
        timer.save();
        console.log(`Transaction "${type} ${txID}" submitted successfully.`);
        callback({ status: 201 });
    } catch(err) {
        let timer = new Timer({ exceptionRaised: true, inTransit: 0, type: 'insert' });
        timer.save();
        console.log(`Failed to submit transaction "${type} ${txID}" with: ${err.message}`);
        callback({ status: 500 });
    }
}

async function sendQuery(org, type, keys, callback) {
    let txs = [];
    try {
        let start = Date.now();
        if (typeof type == 'string')
            txs = await query(org, type, keys);
        else if (Array.isArray(type))
            txs = await queryAll(org, type, keys);
        let end = Date.now() - start;
        let timer = new Timer({ exceptionRaised: false, inTransit: end, type: 'query' });
        timer.save();
        callback({ values: txs, status: 200 })
    } catch(err) {
        let timer = new Timer({ exceptionRaised: true, inTransit: 0, type: 'query' });
        timer.save();
        console.log(`Failed to evaluate transaction with: ${err.message}`);
        callback({ status: 500 });
    }
}

function requestToken(user, org) {
    Login.find({ "user": user, "terminated": "0", "org": org }, null, {sort: {date: -1}}, function(err, logins) {
        if (err) {
            console.log(err);
        } else {
            if (logins.length === 0) {
                let login = new Login();
                login.user = user;
                login.org = org;
                login.date = Date.now();
                login.terminated = '0';
                
                jwt.sign({ user: {user, org} }, utils.jwt(), function(err, token) {
                    if (err) {
                        console.log(err);
                    } else {
                        login.token = token;
                        login.save();
                    }
                })
            }
        }
    });
}

async function getUsers(org) {
    let bc = utils.BCService();
    let list = bc.split('/');
    list.pop();
    try {
        let res = await axios.get(`${list.join('/')}/users/${org}`);
        if (res.data.users.length > 0) {
            return res.data.users[0].enrollmentID;
        }  
        return '';
    } catch(err) {
        console.log(err.message);
        return '';
    }

}

module.exports.query = sendQuery;
module.exports.invoke = sendInvoke;
module.exports.requestToken = requestToken;