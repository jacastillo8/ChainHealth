const express = require('express');
const emr = require('../services/emr');
const utils = require('../services/utils');

const router = express.Router();

let Device = require('../models/device');

// Renders HTML form for vitals
router.get('/vitals/:pid', function(req, res){
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else if (res.locals.role.indexOf('healthcare') === -1) {
        res.redirect('/');
    } else {
        Device.find({ "authentication": "0", "org": utils.getName(res.locals.org) }, ["location", "client"], function(err, devices) {
            res.render('form_vitals', {
                pid: req.params.pid, 
                devices: devices
            });
        });
    }
});

// Renders HTML form for patients
router.get('/new', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else if (res.locals.role.indexOf('healthcare') === -1) {
        res.redirect('/');
    } else {
        res.render('form_patient');
    }
});

// Renders HTML charts -- chart_vitals
router.get('/display/:pid/:tab', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        res.render('tabs', {
            pid: req.params.pid,
            tab: req.params.tab.toLowerCase()
        });
    }
});

router.get('/:pid/medication', function(req, res) {
    emr.tokenValid(res.locals.user, utils.getName(res.locals.org), function(valid) {
        if (valid) {
            emr.getToken(res.locals.user, utils.getName(res.locals.org), function(token) {
                emr.getMedication({ token: token.token, org: res.locals.org, pid: req.params.pid }, function(response) {
                    if (response.status === 200) {
                        res.send(response);
                    } else {
                        res.send([]);
                    }
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

router.get('/medication/:pid', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        res.render('form_medication', {
            pid: req.params.pid
        });
    }
});

router.get('/:pid/issues', function(req, res) {
    emr.tokenValid(res.locals.user, utils.getName(res.locals.org), function(valid) {
        if (valid) {
            emr.getToken(res.locals.user, utils.getName(res.locals.org), function(token) {
                emr.getIssue({ token: token.token, org: res.locals.org, pid: req.params.pid }, function(response) {
                    if (response.status === 200) {
                        res.send(response);
                    } else {
                        res.send([]);
                    }
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

router.get('/issues/:pid', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        res.render('form_issue', {
            pid: req.params.pid
        });
    }
});

router.get('/:pid/allergies', function(req, res) {
    emr.tokenValid(res.locals.user, utils.getName(res.locals.org), function(valid) {
        if (valid) {
            emr.getToken(res.locals.user, utils.getName(res.locals.org), function(token) {
                emr.getAllergy({ token: token.token, org: res.locals.org, pid: req.params.pid }, function(response) {
                    if (response.status === 200) {
                        res.send(response);
                    } else {
                        res.send([]);
                    }
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

router.get('/allergies/:pid', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        res.render('form_allergy', {
            pid: req.params.pid
        });
    }
});

router.get('/:pid/surgeries', function(req, res) {
    emr.tokenValid(res.locals.user, utils.getName(res.locals.org), function(valid) {
        if (valid) {
            emr.getToken(res.locals.user, utils.getName(res.locals.org), function(token) {
                emr.getSurgery({ token: token.token, org: res.locals.org, pid: req.params.pid }, function(response) {
                    if (response.status === 200) {
                        res.send(response);
                    } else {
                        res.send([]);
                    }
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

router.get('/surgeries/:pid', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        res.render('form_surgery', {
            pid: req.params.pid
        });
    }
});

// Get single patient 
router.get('/:pid', function(req, res) {
    emr.tokenValid(res.locals.user, utils.getName(res.locals.org), function(valid) {
        if (valid) {
            emr.getToken(res.locals.user, utils.getName(res.locals.org), function(token) {
                emr.getSinglePatient({ token: token.token, org: res.locals.org, pid: req.params.pid }, function(response) {
                    if (response.status === 200) {
                        res.send(response.patient);
                    } else {
                        res.send([]);
                    }
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

// Renders HTML tables for patients
router.get('/', function(req, res) {
    emr.tokenValid(res.locals.user, utils.getName(res.locals.org), function(valid) {
        if (valid) {
            emr.getToken(res.locals.user, utils.getName(res.locals.org), function(token) {
                emr.getPatients({token: token.token, org: res.locals.org}, function(response) {
                    if (response.status === 200) {
                        res.render('patients', {
                            patients: response.patients
                        });
                    } else if (response.status === 401) {
                        req.flash('danger', 'Unauthorized Access. Please Login');
                        res.redirect('/users/login');
                    } else if (response.status === 400) {
                        req.flash('warning', 'No Patient in EMR. Create a patient');
                        res.redirect('/patient/new');
                    }
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

router.get('/insurance/:type/:pid', function(req, res) {
    emr.tokenValid(res.locals.user, utils.getName(res.locals.org), function(valid) {
        if (valid) {
            emr.getToken(res.locals.user, utils.getName(res.locals.org), function(token) {
                emr.getInsurance({ pid: req.params.pid, token: token.token, org: res.locals.org, type: req.params.type }, function(response) {
                    res.send(response);
                });
            });
        }
    });
});

router.get('/insurance/:type/:action/:pid', function(req, res) {
    if (typeof res.locals.user === 'undefined' || res.locals.user === null) {
        req.flash('danger', 'Unauthorized Access. Please Login');
        res.redirect('/users/login');
    } else {
        res.render('form_insurance', {
            pid: req.params.pid, 
            type: req.params.type, 
            action: req.params.action 
        });
    }
});


module.exports = router;