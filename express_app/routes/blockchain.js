const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const blockchain = require('../services/blockchain');
const utils = require('../services/utils');

// Enroll both admin and user for blockchain interaction
//blockchain.setup(utils.orgs);

// Bring Models
let Login = require('../models/login');
let Transaction = require('../models/transaction');
let Timer = require('../models/timer');

// Display patients in blockchain
router.get('/', function(req, res){
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        // Different views for different roles
        if (utils.getRole(res.locals.org).indexOf('auditor') > -1) {
            Transaction.find().distinct('type', function(err, txs) {
                let names = [];
                txs.map(function(val) {
                    if (val !== "pat" && val !== "vit") {
                        names.push(utils.getTransactionMap()[val]);
                    }
                    return
                });
                res.render('chainmed_auditor', {
                    transactions: names
                });
            });
        } else {
            res.redirect('/');
        }
    }
});

// Insert vitals into the BC
router.post('/:org/vitals/:tid/:pid', verifyToken, function(req, res) {
    jwt.verify(req.token, utils.jwt, function(err, data) {
        if (err) {
            Login.findOne({ "token": req.token, "terminated": '0', "org": req.params.org }, function(err, login) {
                if (err) {
                    console.log(err);
                } else {
                    if (login) {
                        let data = req.body;
                        data.pid = req.params.pid;
                        data.org = req.params.org;
                        blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_vit", req.params.tid, [data], function(status) {
                            res.status(Number(status.status)).json({});
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            });
        } else {
            let data = req.body;
            data.pid = req.params.pid;
            data.org = req.params.org;
            blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_vit", req.params.tid, [data], function(status) {
                res.status(Number(status.status)).json({});
            });
        }
    });
});

// Insert patients into the BC
router.post('/:org/patients/:tid', verifyToken, function(req, res) {
    jwt.verify(req.token, utils.jwt, function(err, data) {
        if (err) {
            Login.findOne({ "token": req.token, "terminated": '0', "org": req.params.org }, function(err, login) {
                if (err) {
                    console.log(err);
                } else {
                    if (login) {
                        let patient = req.body;
                        patient.org = req.params.org;
                        blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_pat", req.params.tid, [patient], function(status) {
                            res.status(Number(status.status)).json({});
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            });
        } else {
            let patient = req.body;
            patient.org = req.params.org;
            blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_pat", req.params.tid, [patient], function(status) {
                res.status(Number(status.status)).json({});
            });
        }
    });
});

// Insert medication into the BC
router.post('/:org/medication/:tid/:pid', verifyToken, function(req, res) {
    jwt.verify(req.token, utils.jwt, function(err, data) {
        if (err) {
            Login.findOne({ "token": req.token, "terminated": '0', "org": req.params.org }, function(err, login) {
                if (err) {
                    console.log(err);
                } else {
                    if (login) {
                        let medication = req.body;
                        medication.pid = req.params.pid;
                        medication.org = req.params.org;
                        blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_med", req.params.tid, [medication], function(status) {
                            res.status(Number(status.status)).json({});
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            });
        } else {
            let medication = req.body;
            medication.pid = req.params.pid;
            medication.org = req.params.org;
            blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_med", req.params.tid, [medication], function(status) {
                res.status(Number(status.status)).json({});
            });
        }
    });
});

// Insert medical issue into the BC
router.post('/:org/issue/:tid/:pid', verifyToken, function(req, res) {
    jwt.verify(req.token, utils.jwt, function(err, data) {
        if (err) {
            Login.findOne({ "token": req.token, "terminated": '0', "org": req.params.org }, function(err, login) {
                if (err) {
                    console.log(err);
                } else {
                    if (login) {
                        let issue = req.body;
                        issue.pid = req.params.pid;
                        issue.org = req.params.org;
                        blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_iss", req.params.tid, [issue], function(status) {
                            res.status(Number(status.status)).json({});
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            });
        } else {
            let issue = req.body;
            issue.pid = req.params.pid;
            issue.org = req.params.org;
            blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_iss", req.params.tid, [issue], function(status) {
                res.status(Number(status.status)).json({});
            });
        }
    });
});

// Insert allergy into the BC
router.post('/:org/allergy/:tid/:pid', verifyToken, function(req, res) {
    jwt.verify(req.token, utils.jwt, function(err, data) {
        if (err) {
            Login.findOne({ "token": req.token, "terminated": '0', "org": req.params.org }, function(err, login) {
                if (err) {
                    console.log(err);
                } else {
                    if (login) {
                        let allergy = req.body;
                        allergy.pid = req.params.pid;
                        allergy.org = req.params.org;
                        blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_all", req.params.tid, [allergy], function(status) {
                            res.status(Number(status.status)).json({});
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            });
        } else {
            let allergy = req.body;
            allergy.pid = req.params.pid;
            allergy.org = req.params.org;
            blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_all", req.params.tid, [allergy], function(status) {
                res.status(Number(status.status)).json({});
            });
        }
    });
});

// Insert surgery into the BC
router.post('/:org/surgery/:tid/:pid', verifyToken, function(req, res) {
    jwt.verify(req.token, utils.jwt, function(err, data) {
        if (err) {
            Login.findOne({ "token": req.token, "terminated": '0', "org": req.params.org }, function(err, login) {
                if (err) {
                    console.log(err);
                } else {
                    if (login) {
                        let surgery = req.body;
                        surgery.pid = req.params.pid;
                        surgery.org = req.params.org;
                        blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_sur", req.params.tid, [surgery], function(status) {
                            res.status(Number(status.status)).json({});
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            });
        } else {
            let surgery = req.body;
            surgery.pid = req.params.pid;
            surgery.org = req.params.org;
            blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_sur", req.params.tid, [surgery], function(status) {
                res.status(Number(status.status)).json({});
            });
        }
    });
});

// Insert insurance into the BC
router.post('/:org/insurance/:tid/:pid', verifyToken, function(req, res) {
    jwt.verify(req.token, utils.jwt, function(err, data) {
        if (err) {
            Login.findOne({ "token": req.token, "terminated": '0', "org": req.params.org }, function(err, login) {
                if (err) {
                    console.log(err);
                } else {
                    if (login) {
                        let data = req.body;
                        data.pid = req.params.pid;
                        data.org = req.params.org;
                        blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_ins", req.params.tid, [data], function(status) {
                            res.status(Number(status.status)).json({});
                        });
                    } else {
                        res.sendStatus(403);
                    }
                }
            });
        } else {
            let data = req.body;
            data.pid = req.params.pid;
            data.org = req.params.org;
            blockchain.invoke(utils.getDomain(req.params.org), req.params.org + "_ins", req.params.tid, [data], function(status) {
                res.status(Number(status.status)).json({});
            });
        }
    });
});

// Queries the BC
router.post('/query', function(req, res) {
    if (typeof req.session.user === 'undefined' || req.session.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        let eid = []
        for (let i=0; i < req.body.eid.length; i++) {
            eid.push({"eid": req.body.eid[i]});
        }

        // Empty object needed in case eid not supplied
        if (eid.length === 0) {
            eid.push({});
        }

        Transaction.find({ "org": utils.getName(req.session.org), "pid": req.body.pid, "type": req.body.type, $or: eid }, ["id"], {sort: {id: -1}}, function(err, txs) {
            let ids = [];
            for (let j=0; j < txs.length; j++) {
                ids.push(txs[j].id);
            }
            blockchain.query(req.session.org, utils.getName(req.session.org) + "_" + req.body.type, ids, function(txs) {
                if (txs.status === 200) {
                    let data = txs.values;
                    let response = [];
                    for (let i=0; i < data.length; i++) {
                        var obj = data[i].data;
                        for (let j=0; j < obj.length; j++) {
                            if (obj.pid = req.body.pid) {
                                response.push(obj[j]);
                            }
                        }
                    }
                    // Parse all transactions before returning value to client
                    res.status(201).json(JSON.stringify(response));
                } else {
                    res.status(Number(txs.status)).json({});
                }
            });
        });

    }
});

// Get BC timing delays from Mongo
router.get('/timer', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        Timer.find({}, function(err, txs) {
            if (err) {
                console.log(err);
            } else {
                let invoke = [];
                let query = [];
                for (let i=0; i < txs.length; i++) {
                    if (txs[i].type === 'insert') {
                        invoke.push(txs[i].inTransit);
                    } else {
                        query.push(txs[i].inTransit);
                    }
                }
                res.status(200).json({ invoke: invoke, query: query });
            }
        });
    }
});

// Get Number of transactions per type
router.get('/types', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        Transaction.distinct('org', function(err, orgs) {
            if (err) {
                console.log(err);
            } else {
                let obj = {};
                orgs.forEach(function(org, i) {
                    obj[org] = {};
                    Transaction.find({ "org": org }).distinct('type', function(err, types) {
                        if (err) {
                            console.log(err);
                        } else {
                            for (let j=0; j < types.length; j++) {
                                Transaction.find({ "type": types[j], "org": org }, function(err, txs) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        obj[org][types[j]] = txs.length;
                                    }
                                    if (j === (types.length - 1)) {
                                        for (let k=0; k < utils.getAvailableTransactions().length; k++) {
                                            if (!(utils.getAvailableTransactions()[k] in obj[org])) {
                                                obj[org][utils.getAvailableTransactions()[k]] = 0;
                                            }
                                        }
                                        obj[org] = Object.keys(obj[org])
                                                            .sort()
                                                            .reduce(function(data, key) {
                                                                data[key] = obj[org][key];
                                                                return data;
                                                            }, {});
                                        if (i === (orgs.length - 1)) {
                                            res.status(200).json(obj);
                                        }
                                    }
                                });
                            }
                        }
                    });
                });
            }
        });
    }
});

// Get transaction values according to type from BC
router.get('/query/:type', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        Transaction.find({ "type": req.params.type.slice(0,3) }, function(err, txs) {
            if (err) {
                console.log(err);
            } else {
                let types = [];
                let ids = {};
                txs.map(function(tx) {
                    if (`${tx.org}_${req.params.type.slice(0,3)}` in ids) {
                        ids[`${tx.org}_${req.params.type.slice(0,3)}`].push(tx.id);
                    } else {
                        ids[`${tx.org}_${req.params.type.slice(0,3)}`] = [];
                        ids[`${tx.org}_${req.params.type.slice(0,3)}`].push(tx.id);
                    }
                    if (!types.includes(`${tx.org}_${req.params.type.slice(0,3)}`)) {
                        types.push(`${tx.org}_${req.params.type.slice(0,3)}`);
                    }
                    return 
                });
                blockchain.query(res.locals.org, types, ids, function(txs) {
                    if (txs.status === 200) {
                        let data = txs.values;
                        let list = [];
                        for (let i=0; i < data.length; i++) {
                            item = data[i].data;
                            list = list.concat(item);
                        }
                        let obj = {};
                        for (let i=0; i < list.length; i++) {
                            var title = list[i].title;
                            if (!(title in obj)) {
                                obj[title] = {};
                            }
                            if (!(list[i].org in obj[title])) {
                                obj[title][list[i].org] = [list[i].pid];
                            } else if (!obj[title][list[i].org].includes(list[i].pid)) {
                                obj[title][list[i].org].push(list[i].pid);
                            }
                        }
                        res.status(200).json(obj);
                    } else {
                        res.statusCode(500);
                    }
                });
            }
        });
    }
});

// Create JSON file to be downloaded - contains vitals of affected patients
router.post('/query/:type', function(req, res) {
    if (typeof req.session.user === 'undefined' || req.session.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        if (req.params.type !== "insurance") {
            let body = req.body;
            let arr = []
            let keys = Object.keys(body);
            for (let i=0; i < keys.length; i++) {
                for (let j=0; j < body[keys[i]].length; j++) {
                    let obj = {};
                    obj["org"] = keys[i];
                    obj["pid"] = body[keys[i]][j];
                    arr.push(obj);
                }
            }
            Transaction.find({ "type": req.params.type.slice(0,3), $or: arr}, function(err, txs) {
                if (err) {
                    console.log(err);
                } else {
                    let types = [];
                    let ids = {};
                    txs.map(function(tx) {
                        if (`${tx.org}_${req.params.type.slice(0,3)}` in ids) {
                            ids[`${tx.org}_${req.params.type.slice(0,3)}`].push(tx.id);
                        } else {
                            ids[`${tx.org}_${req.params.type.slice(0,3)}`] = [];
                            ids[`${tx.org}_${req.params.type.slice(0,3)}`].push(tx.id);
                        }
                        if (!types.includes(`${tx.org}_${req.params.type.slice(0,3)}`)) {
                            types.push(`${tx.org}_${req.params.type.slice(0,3)}`);
                        }
                        return 
                    });
                    blockchain.query(req.session.org, types, ids, function(txs) {
                        if (txs.status === 200) {
                            let data = txs.values;
                            let list = [];
                            for (let i=0; i < data.length; i++) {
                                var item = data[i].data;
                                list = list.concat(item);
                            }
                            let fileID = Date.now();
                            fs.writeFileSync(`temp/${fileID}.json`, JSON.stringify(list));
                            res.send(String(fileID));
                        } else {
                            res.statusCode(500);
                        }
                    });
                }
            });
        } else {
            Transaction.find({ "type": req.params.type.slice(0,3) }, function(err, txs) {
                if (err) {
                    console.log(err);
                } else {
                    let types = [];
                    let ids = {};
                    txs.map(function(tx) {
                        if (`${tx.org}_${req.params.type.slice(0,3)}` in ids) {
                            ids[`${tx.org}_${req.params.type.slice(0,3)}`].push(tx.id);
                        } else {
                            ids[`${tx.org}_${req.params.type.slice(0,3)}`] = [];
                            ids[`${tx.org}_${req.params.type.slice(0,3)}`].push(tx.id);
                        }
                        if (!types.includes(`${tx.org}_${req.params.type.slice(0,3)}`)) {
                            types.push(`${tx.org}_${req.params.type.slice(0,3)}`);
                        }
                        return 
                    });
                    blockchain.query(req.session.org, types, ids, function(txs) {
                        if (txs.status === 200) {
                            let data = txs.values;
                            let list = [];
                            for (let i=0; i < data.length; i++) {
                                item = data[i].data;
                                list = list.concat(item);
                            }
                            let arr = [];
                            list.forEach(function(el, i) {
                                arr.push({
                                    pid: el.pid,
                                    org: el.org,
                                    copay: el.copay,
                                    plan_name: el.plan_name,
                                    policy_number: el.policy_number,
                                    policy_type: el.policy_type,
                                    provider: el.provider,
                                    type: el.type
                                });
                                if (i === (list.length - 1)) {
                                    let fileID = Date.now();
                                    fs.writeFileSync(`temp/${fileID}.json`, JSON.stringify(arr));
                                    res.send(String(fileID));
                                }
                            });
                        } else {
                            res.statusCode(500);
                        }
                    });
                }
            });
        }
        
    }
});

// File route
router.get('/:fileID', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        let name = req.params.fileID + '.json';
        let file = fs.readFileSync(`temp/${name}`);
        res.status(200).json(JSON.parse(file));
    }
});

function verifyToken(req, res, next) {
    const header = req.headers["authorization"];
    if (typeof header !== 'undefined') {
        req.token = header.split(' ')[1];
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = router;