const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const blockchain = require('./blockchain');
const utils = require('./utils');

// Models
let Encounter = require('../models/encounter');
let Transaction = require('../models/transaction');
let Login = require('../models/login');
let Event = require('../models/event');

let queue = {
    all: {},
    ins: {},
    iss: {},
    med: {},
    pat: {},
    sur: {},
    vit: {}
};

// MISCELLANEOUS FUNCTIONS
// Updates global queue
function updateQueue(id, type, org) {
    if (!(utils.getName(org) in queue[type])) {
        queue[type][utils.getName(org)] = [];
    } 
    if (!queue[type][utils.getName(org)].includes(id)) {
        queue[type][utils.getName(org)].push(id)
    } else {
        id = queue[type][utils.getName(org)][queue[type][utils.getName(org)].length - 1] + 1;
        queue[type][utils.getName(org)].push(id);
    }
    return id;
}

// Removes element from queue
function removeQueue(id, type, org) {
    let index = queue[type][utils.getName(org)].indexOf(id);
    if (index > -1) {
        queue[type][utils.getName(org)].splice(index, 1);
    }
}

// Checks validity of token wrt user
function tokenValid(user, org, callback) {
    if (org === null) {
        callback(false);
    } else {
        Login.findOneAndUpdate({ "user": user, "org": org }, null, { sort: {date: -1}}, function(err, login) {
            if (login === null || Object.keys(login).length === 0 || login.terminated === '1') {
                return callback(false);
            } else {
                if ((Number(Date.now()) - Number(login.date)) < 3590000) {
                    return callback(true);
                }
                login.terminated = '1';
                login.save();
                callback(false);
            }
        });
    }
}

// Gets token stored in DB wrt to user
function getToken(user, org, callback) {
    Login.findOne({ "user": user, "org": org }, ['date', 'token'], { sort: {date: -1}}, function(err, login) {
        if (Object.keys(login).length === 0) {
            return callback({ token: null });
        } else {
            if ((Number(Date.now()) - Number(login.date)) < 3590000) {
                return callback({ token: login.token });
            }
            callback({ token: null });;
        }
    });
}

// Requests new token if token is not available
function requestToken(options, callback) {
    tokenValid(options.user, utils.getName(options.org), function(valid) {
        if (!valid) {
            let data = {grant_type:"password",
                        username:options.user,
                        password:options.pass,
                        scope:"default"};

            // New request set-up
            let xhr = new XMLHttpRequest();
            let url = utils.EMRService(options.org) + "/apis/api/auth";

            // Method and Header settings
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/json");

            // Async callback for response
            xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        let json = JSON.parse(xhr.responseText);
                        // Create new entry
                        let login = new Login();
                        login.user = options.user;
                        login.org = utils.getName(options.org);
                        login.date = Date.now();
                        login.token = json["access_token"];
                        login.terminated = '0';
                        login.save(function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        callback({ token: json["access_token"], status: xhr.status });
                    } else if (xhr.readyState === 4 && xhr.status === 401) {
                        callback({ status: xhr.status });
                    } 
                }
            xhr.send(JSON.stringify(data));
        } else {
            // Return available token
            Login.findOne({ "user": options.user, "org": utils.getName(options.org) }, ['date', 'token'], {sort: {date: -1}}, function(err, login) {
                callback({ token: login.token, status: 200 });
            });
        }
    });
}

// Function used to get encounters - returns array of encounters
function getEncounters(options, callback) {
    // Prepares new request
    let xhr = new XMLHttpRequest();
    // check pid and eid, could be given through vitals
    let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/encounter";
    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);
    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let encounters = JSON.parse(xhr.responseText);
            // List of encounters
            callback({ encounters: encounters, status: xhr.status });
        } else if (xhr.readyState === 4 && xhr.status === 400) {
            callback({ status: xhr.status });
        }
    }
    xhr.send(null);
}

// PATIENT FUNCTIONS
// Function to gets all patients from EMR - returns array of patients
function getPatients(options, callback) {
    // New request set-up
    let xhr = new XMLHttpRequest();
    let url = utils.EMRService(options.org) + "/apis/api/patient";
    
    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);

    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let patients = JSON.parse(xhr.responseText);
            // List of patients
            callback({ patients: patients, status: xhr.status });
        } else if (xhr.readyState === 4 && xhr.status === 400) {
            callback({status: xhr.status});
        } 
    }
    xhr.send(null);
}

// Fucntion used to get a single patient using pid - returns patient
function getSinglePatient(options, callback) {
    // New request set-up
    let xhr = new XMLHttpRequest();
    let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid;

    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);

    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let patient = JSON.parse(xhr.responseText);
            // List of patients
            callback({ patient: patient, status: xhr.status });
        }
    }
    xhr.send(null);
}

// Gets an instance of a patient vital record
function vitalPatient(options, callback) {
    // New request set-up
    let xhr = new XMLHttpRequest();
    let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/encounter/" + options.eid + "/vital";

    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);

    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let json = JSON.parse(xhr.responseText);
            callback({ vital: json, status: xhr.status });
        }
    }
    xhr.send(null);
}

// Function used to get vitals - returns array of vitals
function getVitals(options, callback) {
    getEncounters(options, function(response){
        let Encounters = [];
        let Vitals = [];

        if (response.status !== 400){
            Encounters = Encounters.concat(response.encounters);
        } 
        Encounter.find({ "pid": String(options.pid), "org": utils.getName(options.org) }, ['id', 'date'], {sort:{date: -1}}, function(err, encounters) {
            if (err) {
                console.log(err);
            } else if (encounters.length === 0) {
                // pass
            } else{
                Encounters = Encounters.concat(encounters);
            }
            // Sort encounters by eid
            Encounters = Encounters.sort(function(a,b) {
                return Number(b.id) - Number(a.id);
            });

            let eids = [];
            for (let i=0; i < encounters.length; i++) {
                eids.push(encounters[i].id);
            }

            //let eids_emr = [];
            Encounters.forEach(function(encounter) {  
                options.eid = encounter.id;
                vitalPatient(options, function(res) {
                    // Contains multiple responses - processing done at higher level
                    Vitals.push(res.vital);
                    if (Vitals.length === Encounters.length) {
                        callback({ vitals: Vitals, eids: eids, status: 200 });
                    }
                })
            });
        });
    });
}

// Function used to submit new patients - returns new pid
function createPatient(options, callback) {
    let id = 0;
    Transaction.find({ "type": "pat", "org": utils.getName(options.org) }, ["id"], {sort:{id: -1}}, function(err, transaction) {
        if (err) {
            console.log(err);
        } else if (transaction.length === 0) {
            // pass
        } else {
            id = Number(transaction[0].id);
        }
        id = updateQueue(id + 1, "pat", options.org);
        // New request set-up
        let xhr1 = new XMLHttpRequest();
        let url1 = `http://${utils.host}:${utils.port}/blockchain/${utils.getName(options.org)}/patients/${id}`;

        // Method and Header settings
        xhr1.open("POST", url1);
        xhr1.setRequestHeader("Authorization", "Bearer " + options.token);
        xhr1.setRequestHeader('Content-Type', 'application/json');

        // Async callback for response
        xhr1.onreadystatechange = function() {
            if (xhr1.readyState === 4 && xhr1.status === 201) {
                let xhr2 = new XMLHttpRequest();
                let url2 = utils.EMRService(options.org) + "/apis/api/patient";

                xhr2.open("POST", url2);
                xhr2.setRequestHeader("Authorization", "Bearer " + options.token);

                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 201) {
                        let json = JSON.parse(xhr2.responseText);
                        // Save map into DB
                        let tx = new Transaction();
                        tx.type = "pat";
                        tx.id = String(id);
                        tx.pid = String(json.pid);
                        tx.org = utils.getName(options.org);
                        tx.save(function(err) {
                            removeQueue(id, "pat", options.org);
                        });
                        callback({ status: xhr2.status });
                    }
                }
                xhr2.send(JSON.stringify(options.data));
            }
        }
        xhr1.send(JSON.stringify(options.data));
    });
}

// Function used to insert values to both BC and EMR
function insert(options, callback) {
    let id = 0;
    Transaction.find({ "type": "vit", "org": utils.getName(options.org) }, ["id"], {sort:{id: -1}}, function(err, transaction) {
        if (err) {
            console.log(err);
        } else if (transaction.length === 0) {
            // pass
        } else {
            id = Number(transaction[0].id);
        }
        id = updateQueue(id + 1, "vit", options.org);
        // Store new encounter to DB
        let encounter = new Encounter();
        encounter.id = options.eid;
        encounter.pid = options.pid;
        encounter.org = utils.getName(options.org)
        encounter.date = Date.now(); 
        
        let xhr1 = new XMLHttpRequest();
        let url1 = `http://${utils.host}:${utils.port}/blockchain/${utils.getName(options.org)}/vitals/${id}/${options.pid}`;
        xhr1.open("POST", url1);
        xhr1.setRequestHeader('Authorization', 'Bearer ' + options.token)
        xhr1.setRequestHeader('Content-Type', 'application/json');
        xhr1.onreadystatechange = function() {
            if (xhr1.readyState === 4 && xhr1.status === 201) {
                // Save map into DB
                let tx = new Transaction();
                tx.type = "vit";
                tx.id = String(id);
                tx.eid = String(options.eid);
                tx.pid = String(options.pid);
                tx.org = utils.getName(options.org)
                tx.save(function(err) {
                    removeQueue(id, "vit", options.org);
                });

                // Prepares new request
                let xhr2 = new XMLHttpRequest();
                // Use pid and eid
                let url2 = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/encounter/" + options.eid + "/vital";
                // Method and Header settings
                xhr2.open("POST", url2);
                xhr2.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 201) {
                        let json = JSON.parse(xhr2.responseText);
                        encounter.vid = json.vid;
                        encounter.save();
                        callback({ vid: json["vid"], status: xhr2.status });
                    }
                }
                xhr2.send(JSON.stringify(options.vitals));
            }
        }
        xhr1.send(JSON.stringify(options.vitals));
    });
}

// Function used to submit patient vitals - returns vid
function sendVitals(options, callback) {
    // Get Possible Encounters
    getEncounters(options, function(req) {
        let eid;
        if (req.status === 400) {
            // Search in application DB and sort results by date
            Encounter.find({ "pid": String(options.pid), "org": utils.getName(options.org) }, ['id', 'date'], {sort:{date: -1}}, function(err, encounters) {
                if (err) {
                    console.log(err);
                // If no results in DB then evaluate encounter ID (eid) to 1 (first encounter)
                } else if (encounters.length == 0) {
                    eid = "0";
                // If there are available encounters, evaluate eid to last encounter
                } else {
                    eid = String(encounters[0].id);
                }
                // Increment encounter by 1
                eid = Number(eid) + 1;

                insert({ pid: options.pid, eid: eid, vitals: options.vitals, 
                    token: options.token, org: options.org }, function(response) {
                    callback({ status: response.status });
                });
            });
        // If there are available encounters from API
        } else {
            // Search in application DB and sort results by date
            Encounter.find({ "pid": String(options.pid), "org": utils.getName(options.org) }, ['id', 'date'], {sort:{date: -1}}, function(err, encounters) {
                if (err) {
                    console.log(err);
                // If no results available, ignore
                } else if (encounters.length == 0) {
                    eid = "0";
                // If results available, compare dates
                } else {
                    // Comparison deals with time difference
                    if (new Date(encounters[0].date) >= new Date(req.encounters[0].date)) {
                        eid = encounters[0].id;
                        if (eid === (Number(req.encounters[0].id) - 1)) {
                            eid = Number(eid) + 1;
                        }
                    } else {
                        eid = req.encounters[0].id;
                    }
                }
                // Increment encounter by 1
                eid = Number(eid) + 1;

                insert({ pid: options.pid, eid: eid, vitals: options.vitals, 
                    token: options.token, org: options.org }, function(response) {
                    callback({ status: response.status });
                });
            }); 
        }
    });
}

// Function used to update EMR vital entry
function updateVitals(options, callback) {
    Encounter.findOne({ "id": options.eid, "pid": options.pid, "org": utils.getName(options.org) }, function(err, encounter) {
        if (err) {
            console.log(err);
        } else {
            if (encounter) {
                // Prepares new request
                let xhr = new XMLHttpRequest();
                // Use pid and eid
                let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/encounter/" + options.eid + "/vital/" + encounter.vid;

                // Method and Header settings
                xhr.open("PUT", url);
                xhr.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        callback({status: 200});
                    }
                }
                xhr.send(JSON.stringify(JSON.parse(options.vitals.vitals)));
            }
        }
    });
}

// Function used to get medications from pid
function getMedication(options, callback) {
    // New request set-up
    let xhr = new XMLHttpRequest();
    let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + '/medication';

    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);

    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let medication = JSON.parse(xhr.responseText);
            Event.find({ "pid": options.pid, "org": utils.getName(options.org) }, function(err, events) {
                if (err) {
                    console.log(err);
                }
                let mids = [];
                for (let i=0; i < events.length; i++) {
                    var event = events[i].toObject();
                    if (event.hasOwnProperty('mid')) {
                        mids.push(event.mid);
                    }
                }
                 // List of issues
                callback({ medication: medication, mids: mids, status: xhr.status });
            });
        } else if (xhr.readyState === 4 && xhr.status === 400) {
            callback({ status: xhr.status });
        }
    }
    xhr.send(null);
}

// Function used to submit patient medication - returns mid
function sendMedication(options, callback) {
    let id = 0;
    Transaction.find({ "type": "med", "org": utils.getName(options.org) }, ["id"], {sort:{id: -1}}, function(err, transaction) {
        if (err) {
            console.log(err);
        } else if (transaction.length === 0) {
            // pass
        } else {
            id = Number(transaction[0].id);
        }
        id = updateQueue(id + 1, "med", options.org);

        let xhr1 = new XMLHttpRequest();
        let url1 = `http://${utils.host}:${utils.port}/blockchain/${utils.getName(options.org)}/medication/${id}/${options.pid}`;
        xhr1.open("POST", url1);
        xhr1.setRequestHeader('Authorization', 'Bearer ' + options.token)
        xhr1.setRequestHeader('Content-Type', 'application/json');
        xhr1.onreadystatechange = function() {
            if (xhr1.readyState === 4 && xhr1.status === 201) {
                // Save map into DB
                let tx = new Transaction();
                tx.type = "med";
                tx.id = String(id);
                tx.pid = String(options.pid);
                tx.org = utils.getName(options.org)
                tx.save(function(err) {
                    removeQueue(id, "med", options.org);
                });

                // Prepares new request
                let xhr2 = new XMLHttpRequest();
                // Use pid and eid
                let url2 = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/medication";
                // Method and Header settings
                xhr2.open("POST", url2);
                xhr2.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 201) {
                        let json = JSON.parse(xhr2.responseText);
                        let event = new Event();
                        event.pid = String(options.pid);
                        event.mid = json.id;
                        event.org = utils.getName(options.org)
                        event.save();
                        callback({ status: xhr2.status });
                    } 
                }
                xhr2.send(JSON.stringify(options.medication));
            }
        }
        xhr1.send(JSON.stringify(options.medication));
    });
}

// Function used to update EMR medication entry
function updateMedication(options, callback) {
    Event.findOne({ "mid": options.mid, "pid": options.pid, "org": utils.getName(options.org) }, function(err, event) {
        if (err) {
            console.log(err);
        } else {
            if (event) {
                // Prepares new request
                let xhr = new XMLHttpRequest();
                // Use pid and eid
                let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/medication/" + event.mid;

                // Method and Header settings
                xhr.open("PUT", url);
                xhr.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        callback({status: 200});
                    }
                }
                xhr.send(JSON.stringify(JSON.parse(options.medication.medication)));
            }
        }
    });
}

// Function used to get medical issues from pid
function getIssue(options, callback) {
    // New request set-up
    let xhr = new XMLHttpRequest();
    let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + '/medical_problem';

    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);

    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let issue = JSON.parse(xhr.responseText);
            Event.find({ "pid": options.pid, "org": utils.getName(options.org) }, function(err, events) {
                if (err) {
                    console.log(err);
                }
                let cids = [];
                for (let i=0; i < events.length; i++) {
                    var event = events[i].toObject();
                    if (event.hasOwnProperty('cid')) {
                        cids.push(event.cid);
                    }
                }
                 // List of issues
                callback({ issue: issue, cids: cids, status: xhr.status });
            });
           
        } else if (xhr.readyState === 4 && xhr.status === 400) {
            callback({ status: xhr.status });
        }
    }
    xhr.send(null);
}

// Function used to submit patient medical issue - returns mid
function sendIssue(options, callback) {
    let id = 0;
    Transaction.find({ "type": "iss", "org": utils.getName(options.org) }, ["id"], {sort:{id: -1}}, function(err, transaction) {
        if (err) {
            console.log(err);
        } else if (transaction.length === 0) {
            // pass
        } else {
            id = Number(transaction[0].id);
        }
        id = updateQueue(id + 1, "iss", options.org);

        let xhr1 = new XMLHttpRequest();
        let url1 = `http://${utils.host}:${utils.port}/blockchain/${utils.getName(options.org)}/issue/${id}/${options.pid}`;
        xhr1.open("POST", url1);
        xhr1.setRequestHeader('Authorization', 'Bearer ' + options.token)
        xhr1.setRequestHeader('Content-Type', 'application/json');
        xhr1.onreadystatechange = function() {
            if (xhr1.readyState === 4 && xhr1.status === 201) {
                // Save map into DB
                let tx = new Transaction();
                tx.type = "iss";
                tx.id = String(id);
                tx.pid = String(options.pid);
                tx.org = utils.getName(options.org)
                tx.save(function(err) {
                    removeQueue(id, "iss", options.org);
                });

                // Prepares new request
                let xhr2 = new XMLHttpRequest();
                // Use pid and eid
                let url2 = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/medical_problem";
                // Method and Header settings
                xhr2.open("POST", url2);
                xhr2.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 201) {
                        let json = JSON.parse(xhr2.responseText);
                        let event = new Event();
                        event.pid = String(options.pid);
                        event.cid = json.id;
                        event.org = utils.getName(options.org)
                        event.save();
                        callback({ status: xhr2.status });
                    }
                }
                xhr2.send(JSON.stringify(options.issue));
            }
        }
        xhr1.send(JSON.stringify(options.issue));
    });
}

// Function used to update EMR medical problem entry
function updateIssue(options, callback) {
    Event.findOne({ "cid": options.cid, "pid": options.pid, "org": utils.getName(options.org) }, function(err, event) {
        if (err) {
            console.log(err);
        } else {
            if (event) {
                // Prepares new request
                let xhr = new XMLHttpRequest();
                // Use pid and eid
                let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/medical_problem/" + event.cid;

                // Method and Header settings
                xhr.open("PUT", url);
                xhr.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        callback({status: 200});
                    }
                }
                xhr.send(JSON.stringify(JSON.parse(options.issue.issue)));
            }
        }
    });
}

// Function used to get allergies from pid
function getAllergy(options, callback) {
    // New request set-up
    let xhr = new XMLHttpRequest();
    let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + '/allergy';

    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);

    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let allergy = JSON.parse(xhr.responseText);
            Event.find({ "pid": options.pid, "org": utils.getName(options.org) }, function(err, events) {
                if (err) {
                    console.log(err);
                }
                let aids = [];
                for (let i=0; i < events.length; i++) {
                    var event = events[i].toObject();
                    if (event.hasOwnProperty('aid')) {
                        aids.push(event.aid);
                    }
                }
                 // List of issues
                callback({ allergy: allergy, aids: aids, status: xhr.status });
            });
        } else if (xhr.readyState === 4 && xhr.status === 400) {
            callback({ status: xhr.status });
        }
    }
    xhr.send(null);
}

// Function used to submit patient allergy - returns aid
function sendAllergy(options, callback) {
    let id = 0;
    Transaction.find({ "type": "all", "org": utils.getName(options.org) }, ["id"], {sort:{id: -1}}, function(err, transaction) {
        if (err) {
            console.log(err);
        } else if (transaction.length === 0) {
            // pass
        } else {
            id = Number(transaction[0].id);
        }
        id = updateQueue(id + 1, "all", options.org);

        let xhr1 = new XMLHttpRequest();
        let url1 = `http://${utils.host}:${utils.port}/blockchain/${utils.getName(options.org)}/allergy/${id}/${options.pid}`;
        xhr1.open("POST", url1);
        xhr1.setRequestHeader('Authorization', 'Bearer ' + options.token)
        xhr1.setRequestHeader('Content-Type', 'application/json');
        xhr1.onreadystatechange = function() {
            if (xhr1.readyState === 4 && xhr1.status === 201) {
                // Save map into DB
                let tx = new Transaction();
                tx.type = "all";
                tx.id = String(id);
                tx.pid = String(options.pid);
                tx.org = utils.getName(options.org)
                tx.save(function(err) {
                    removeQueue(id, "all", options.org);
                });

                // Prepares new request
                let xhr2 = new XMLHttpRequest();
                // Use pid and eid
                let url2 = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/allergy";
                // Method and Header settings
                xhr2.open("POST", url2);
                xhr2.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 201) {
                        let json = JSON.parse(xhr2.responseText);
                        let event = new Event();
                        event.pid = String(options.pid);
                        event.aid = json.id;
                        event.org = utils.getName(options.org)
                        event.save();
                        callback({ status: xhr2.status });
                    } 
                }
                xhr2.send(JSON.stringify(options.allergy));
            }
        }
        xhr1.send(JSON.stringify(options.allergy));
    });
}

// Function used to update EMR allergy entry
function updateAllergy(options, callback) {
    Event.findOne({ "aid": options.aid, "pid": options.pid, "org": utils.getName(options.org) }, function(err, event) {
        if (err) {
            console.log(err);
        } else {
            if (event) {
                // Prepares new request
                let xhr = new XMLHttpRequest();
                // Use pid and eid
                let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/allergy/" + event.aid;

                // Method and Header settings
                xhr.open("PUT", url);
                xhr.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        callback({status: 200});
                    }
                }
                xhr.send(JSON.stringify(JSON.parse(options.allergy.allergy)));
            }
        }
    });
}

// Function used to get surgeries from pid
function getSurgery(options, callback) {
    // New request set-up
    let xhr = new XMLHttpRequest();
    let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + '/surgery';

    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);

    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let surgery = JSON.parse(xhr.responseText);
            Event.find({ "pid": options.pid, "org": utils.getName(options.org) }, function(err, events) {
                if (err) {
                    console.log(err);
                }
                let sids = [];
                for (let i=0; i < events.length; i++) {
                    var event = events[i].toObject();
                    if (event.hasOwnProperty('sid')) {
                        sids.push(event.sid);
                    }
                }
                 // List of surgeries
                callback({ surgery: surgery, sids: sids, status: xhr.status });
            });
        } else if (xhr.readyState === 4 && xhr.status === 400) {
            callback({ status: xhr.status });
        }
    }
    xhr.send(null);
}

// Function used to submit patient surgery - returns sid
function sendSurgery(options, callback) {
    let id = 0;
    Transaction.find({ "type": "sur", "org": utils.getName(options.org) }, ["id"], {sort:{id: -1}}, function(err, transaction) {
        if (err) {
            console.log(err);
        } else if (transaction.length === 0) {
            // pass
        } else {
            id = Number(transaction[0].id);
        }
        id = updateQueue(id + 1, "sur", options.org);

        let xhr1 = new XMLHttpRequest();
        let url1 = `http://${utils.host}:${utils.port}/blockchain/${utils.getName(options.org)}/surgery/${id}/${options.pid}`;
        xhr1.open("POST", url1);
        xhr1.setRequestHeader('Authorization', 'Bearer ' + options.token)
        xhr1.setRequestHeader('Content-Type', 'application/json');
        xhr1.onreadystatechange = function() {
            if (xhr1.readyState === 4 && xhr1.status === 201) {
                // Save map into DB
                let tx = new Transaction();
                tx.type = "sur";
                tx.id = String(id);
                tx.pid = String(options.pid);
                tx.org = utils.getName(options.org)
                tx.save(function(err) {
                    removeQueue(id, "sur", options.org);
                });

                // Prepares new request
                let xhr2 = new XMLHttpRequest();
                // Use pid and eid
                let url2 = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/surgery";
                // Method and Header settings
                xhr2.open("POST", url2);
                xhr2.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 201) {
                        let json = JSON.parse(xhr2.responseText);
                        let event = new Event();
                        event.pid = String(options.pid);
                        event.sid = json.id;
                        event.org = utils.getName(options.org)
                        event.save();
                        callback({ status: xhr2.status });
                    }
                }
                xhr2.send(JSON.stringify(options.surgery));
            }
        }
        xhr1.send(JSON.stringify(options.surgery));
    });
}

// Function used to update EMR surgery entry
function updateSurgery(options, callback) {
    Event.findOne({ "sid": options.sid, "pid": options.pid, "org": utils.getName(options.org) }, function(err, event) {
        if (err) {
            console.log(err);
        } else {
            if (event) {
                // Prepares new request
                let xhr = new XMLHttpRequest();
                // Use pid and eid
                let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/surgery/" + event.sid;

                // Method and Header settings
                xhr.open("PUT", url);
                xhr.setRequestHeader("Authorization", "Bearer " + options.token);

                // Async callback for response
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        callback({status: 200});
                    }
                }
                xhr.send(JSON.stringify(JSON.parse(options.surgery.surgery)));
            }
        }
    });
}

function getInsurance(options, callback) {
    // Prepares new request
    let xhr = new XMLHttpRequest();
    // Use pid and eid
    let url = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/insurance/" + options.type;

    // Method and Header settings
    xhr.open("GET", url);
    xhr.setRequestHeader("Authorization", "Bearer " + options.token);

    // Async callback for response
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let json = JSON.parse(xhr.responseText)
            callback({ insurance: json, status: 200 });
        } else if (xhr.readyState === 4 && xhr.status === 400) {
            callback({ status: xhr.status });
        }
    }
    xhr.send(null);
}

function sendInsurance(options, callback) {
    let id = 0;
    Transaction.find({ "type": "ins", "org": utils.getName(options.org) }, ["id"], {sort:{id: -1}}, function(err, transaction) {
        if (err) {
            console.log(err);
        } else if (transaction.length === 0) {
            // pass
        } else {
            id = Number(transaction[0].id);
        }
        id = updateQueue(id + 1, "ins", options.org);

        // New request set-up
        let xhr1 = new XMLHttpRequest();
        let url1 = `http://${utils.host}:${utils.port}/blockchain/${utils.getName(options.org)}/insurance/${id}/${options.pid}`;

        // Method and Header settings
        xhr1.open("POST", url1);
        xhr1.setRequestHeader("Authorization", "Bearer " + options.token);
        xhr1.setRequestHeader('Content-Type', 'application/json');

        // Async callback for response
        xhr1.onreadystatechange = function() {
            if (xhr1.readyState === 4 && xhr1.status === 201) {
                let xhr2 = new XMLHttpRequest();
                let url2 = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/insurance/" + options.type;

                xhr2.open("POST", url2);
                xhr2.setRequestHeader("Authorization", "Bearer " + options.token);

                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 201) {
                        // Save map into DB
                        let tx = new Transaction();
                        tx.type = "ins";
                        tx.id = String(id);
                        tx.pid = String(options.pid);
                        tx.org = utils.getName(options.org);
                        tx.save(function(err) {
                            removeQueue(id, "ins", options.org);
                        });
                        callback({ status: xhr2.status });
                    }
                }
                xhr2.send(JSON.stringify(options.insurance));
            }
        }
        xhr1.send(JSON.stringify(options.insurance));
    });
}

function updateInsurance(options, callback) {
    Transaction.find({ "type": "ins", "pid": options.pid, "org": utils.getName(options.org) }, function(err, transactions){
        if(err){
            console.log(err);
        } else {
            if (transactions.length !== 0) {
                let ids = [];
                for (let i=0; i < transactions.length; i++) {
                    ids.push(transactions[i].id);
                }
                blockchain.query(options.org, utils.getName(options.org) + "_ins", ids, function(txs) {
                    if (txs.status === 200) {
                        let data = txs.values;
                        let found = false;
                        for (let j=0; j < data.length; j++) {
                            var json = data[j];
                            for (let k=0; k < json.data.length; k++) {
                                if (json.data[k].type === options.type && json.data[k].pid === options.pid) {
                                    var id = transactions[j].id;
                                    found = !found;
                                    break;
                                }
                            }
                            if (found) {
                                break;
                            } else {
                                var id = j + 1;
                            }
                        }
                        // New request set-up
                        let xhr1 = new XMLHttpRequest();
                        let url1 = `http://${utils.host}:${utils.port}/blockchain/${utils.getName(options.org)}/insurance/${id}/${options.pid}`;
                        // Method and Header settings
                        xhr1.open("POST", url1);
                        xhr1.setRequestHeader("Authorization", "Bearer " + options.token);
                        xhr1.setRequestHeader('Content-Type', 'application/json');

                        // Async callback for response
                        xhr1.onreadystatechange = function() {
                            if (xhr1.readyState === 4 && xhr1.status === 201) {
                                let xhr2 = new XMLHttpRequest();
                                let url2 = utils.EMRService(options.org) + "/apis/api/patient/" + options.pid + "/insurance/" + options.type;

                                xhr2.open("PUT", url2);
                                xhr2.setRequestHeader("Authorization", "Bearer " + options.token);

                                xhr2.onreadystatechange = function() {
                                    if (xhr2.readyState === 4 && xhr2.status === 200) {
                                        callback({ status: xhr2.status });
                                    }
                                }
                                xhr2.send(JSON.stringify(options.insurance));
                            }
                        }
                        xhr1.send(JSON.stringify(options.insurance));
                    } else {
                        callback({ status: 400 });
                    }
                });
            }
        }
    });
}

// Exporting modules
module.exports.tokenValid = tokenValid;
module.exports.getToken = getToken;
module.exports.requestToken = requestToken;
module.exports.getPatients = getPatients;
module.exports.getSinglePatient = getSinglePatient;
module.exports.getVitals = getVitals;
module.exports.getEncounters = getEncounters;
module.exports.getMedication = getMedication;
module.exports.getIssue = getIssue;
module.exports.getAllergy = getAllergy;
module.exports.getSurgery = getSurgery;
module.exports.getInsurance = getInsurance;
module.exports.createPatient = createPatient;
module.exports.sendVitals = sendVitals;
module.exports.sendMedication = sendMedication;
module.exports.sendIssue = sendIssue;
module.exports.sendAllergy = sendAllergy;
module.exports.sendSurgery = sendSurgery;
module.exports.sendInsurance = sendInsurance;
module.exports.updateVitals = updateVitals;
module.exports.updateMedication = updateMedication;
module.exports.updateIssue = updateIssue;
module.exports.updateAllergy = updateAllergy;
module.exports.updateSurgery = updateSurgery;
module.exports.updateInsurance = updateInsurance;