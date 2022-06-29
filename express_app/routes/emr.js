const express = require('express');
const emr = require('../services/emr');
const utils = require('../services/utils');

const router = express.Router();

// Helper function used to process multiple requests from vitalPatient - returns bool
function isEquivalent(a, b) {
    // Check if inputs are objects and not null
    if (typeof a == 'object' && a !== null) {
        let aProps = Object.getOwnPropertyNames(a);
        let bProps = Object.getOwnPropertyNames(b);
    
        // Check length first
        if (aProps.length != bProps.length) {
            return false;
        }
    
        // Check individual properties for matches
        for (let i=0; i < aProps.length; i++) {
            let name = aProps[i];
            if (a[name] !== b[name]) {
                return false;
            }
        }
    
        // At this point both objects are the same
        return true;
    } else {
        return false;
    }
}

// Get vitals from specific patient (pid) removing duplicates
router.get('/vitals/:pid', function(req, res) {
    emr.tokenValid(req.session.user, utils.getName(res.locals.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(res.locals.org), function(token) {
                emr.getVitals({ token: token.token, org: res.locals.org, pid: req.params.pid }, function(response) {
                    let merged = [].concat.apply([], response.vitals);
                    if (merged.length > 1) {
                        for (let i=0; i < merged.length; i++) {
                            for (let j=0; j < merged.length; j++) {
                                if (i !== j) {
                                    if (isEquivalent(merged[i], merged[j])) {
                                        merged.splice(j, 1);
                                    }
                                }
                            }
                        }
                    }
                    res.status(200).json({ vitals: merged, eids: response.eids });
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

// Update vitals entry in EMR 
router.post('/vitals/update/:pid/:eid', function(req, res) {
    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.updateVitals({ pid: req.params.pid, eid: req.params.eid, org: req.session.org, token: token.token, vitals: req.body }, function() {
                    res.status(200).json({});
                });
            });
        }
    });
});

// Create new patient
router.post('/new', function(req, res){
    const patient = {};
    patient.title = req.body.title;
    patient.fname = req.body.fname;
    patient.mname = req.body.mname;
    patient.lname = req.body.lname;
    patient.street = req.body.street;
    patient.postal_code = req.body.postalcode;
    patient.city = req.body.city;
    patient.state = req.body.state;
    patient.country_code = req.body.countrycode;
    patient.phone_contact = req.body.phone;
    patient.dob = req.body.dob;
    patient.dob = patient.dob.substring(6,10) + '-' + patient.dob.substring(0,5).replace('/','-');
    patient.sex = req.body.sex;
    patient.ethnicity = req.body.ethnicity;

    if (Array.isArray(req.body.races)) {
        patient.race = req.body.races.join(', ');
    } else {
        patient.race = req.body.races;
    }

    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.createPatient({ data: patient, token: token.token, org: req.session.org }, function() {
                    req.flash('success', 'Patient Created Successfully')
                    res.redirect('/patient');
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

// Create new vitals
router.post('/vitals', function(req, res){
    let vitals = {};
    vitals.bps = req.body.bps;
    vitals.bpd = req.body.bpd;
    vitals.weight = req.body.weight;
    vitals.height = req.body.height;
    vitals.temperature = req.body.temp;
    vitals.temp_method = req.body.temp_method;
    vitals.pulse = req.body.pulse;
    vitals.respiration = req.body.resp;
    vitals.note = req.body.notes;
    vitals.waist_circ = req.body.waist;
    vitals.head_circ = req.body.head;
    vitals.oxygen_saturation = req.body.spo2;

    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.sendVitals({ pid: req.body.pid, vitals: vitals, 
                    token: token.token, org: req.session.org }, function() {
                        req.flash('success', 'Vitals Posted Successfully');
                        res.redirect('/patient/display/' + req.body.pid + '/vitals');
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

// Post new medication
router.post('/medication', function(req, res) {
    let medication = {};
    medication.title = req.body.name;

    let startDate = new Date(req.body.start_date);
    medication.begdate = startDate.getFullYear() + '-' + ('0' + (startDate.getMonth() + 1)).slice(-2) + '-' + ('0' + startDate.getDate()).slice(-2);

    let endDate;
    if (req.body.end_date.length === 0) {
        medication.enddate = null;
    } else {
        endDate = new Date(req.body.end_date);
        medication.enddate = endDate.getFullYear() + '-' + ('0' + (endDate.getMonth() + 1)).slice(-2) + '-' + ('0' + endDate.getDate()).slice(-2);
    }

    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.sendMedication({ pid: req.body.pid, medication: medication, 
                    token: token.token, org: req.session.org }, function() {
                        req.flash('success', 'Medication Posted Successfully');
                        res.redirect('/patient/display/' + req.body.pid + '/overview');
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

// Post new medical problem
router.post('/issue', function(req, res) {
    let issue = {};
    issue.title = req.body.name;
    issue.diagnosis = req.body.diagnosis;

    let startDate = new Date(req.body.start_date);
    issue.begdate = startDate.getFullYear() + '-' + ('0' + (startDate.getMonth() + 1)).slice(-2) + '-' + ('0' + startDate.getDate()).slice(-2);

    let endDate;
    if (req.body.end_date.length === 0) {
        issue.enddate = null;
    } else {
        endDate = new Date(req.body.end_date);
        issue.enddate = endDate.getFullYear() + '-' + ('0' + (endDate.getMonth() + 1)).slice(-2) + '-' + ('0' + endDate.getDate()).slice(-2);
    }

    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.sendIssue({ pid: req.body.pid, issue: issue, 
                    token: token.token, org: req.session.org }, function() {
                        req.flash('success', 'Medical Condition Posted Successfully');
                        res.redirect('/patient/display/' + req.body.pid + '/overview');
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

// Post new allergy
router.post('/allergy', function(req, res) {
    let allergy = {};
    allergy.title = req.body.name;

    let startDate = new Date(req.body.start_date);
    allergy.begdate = startDate.getFullYear() + '-' + ('0' + (startDate.getMonth() + 1)).slice(-2) + '-' + ('0' + startDate.getDate()).slice(-2);

    let endDate;
    if (req.body.end_date.length === 0) {
        allergy.enddate = null;
    } else {
        endDate = new Date(req.body.end_date);
        allergy.enddate = endDate.getFullYear() + '-' + ('0' + (endDate.getMonth() + 1)).slice(-2) + '-' + ('0' + endDate.getDate()).slice(-2);
    }

    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.sendAllergy({ pid: req.body.pid, allergy: allergy, 
                    token: token.token, org: req.session.org }, function() {
                        req.flash('success', 'Allergy Posted Successfully');
                        res.redirect('/patient/display/' + req.body.pid + '/overview');
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

// Post new surgery
router.post('/surgery', function(req, res) {
    let surgery = {};
    surgery.title = req.body.name;
    surgery.diagnosis = req.body.diagnosis;

    let startDate = new Date(req.body.date);
    surgery.begdate = startDate.getFullYear() + '-' + ('0' + (startDate.getMonth() + 1)).slice(-2) + '-' + ('0' + startDate.getDate()).slice(-2);
    surgery.enddate = null;

    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.sendSurgery({ pid: req.body.pid, surgery: surgery, 
                    token: token.token, org: req.session.org }, function() {
                        req.flash('success', 'Surgery Posted Successfully');
                        res.redirect('/patient/display/' + req.body.pid + '/overview');
                });
            });
        } else {
            req.flash('danger', 'Unauthorized Access. Please Login');
            res.redirect('/users/login');
        }
    });
});

// Update medication entry in EMR 
router.post('/medication/update/:pid/:mid', function(req, res) {
    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.updateMedication({ pid: req.params.pid, mid: req.params.mid, org: req.session.org, 
                    token: token.token, medication: req.body }, function() {
                        res.status(200).json({});
                });
            });
        }
    });
});

// Update medical problem entry in EMR 
router.post('/issue/update/:pid/:cid', function(req, res) {
    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.updateIssue({ pid: req.params.pid, cid: req.params.cid, org: req.session.org, 
                    token: token.token, issue: req.body }, function() {
                        res.status(200).json({});
                });
            });
        }
    });
});

// Update allergy entry in EMR 
router.post('/allergy/update/:pid/:aid', function(req, res) {
    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.updateAllergy({ pid: req.params.pid, aid: req.params.aid, org: req.session.org, 
                    token: token.token, allergy: req.body }, function() {
                        res.status(200).json({});
                });
            });
        }
    });
});

// Update surgery entry in EMR 
router.post('/surgery/update/:pid/:sid', function(req, res) {
    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.updateSurgery({ pid: req.params.pid, sid: req.params.sid, org: req.session.org, 
                    token: token.token, surgery: req.body }, function() {
                        res.status(200).json({});
                });
            });
        }
    });
});

router.post('/insurance/:type/add', function(req, res) {
    let insurance = {};
    // Basic info
    insurance.type = req.params.type;
    insurance.provider = req.body.provider;
    insurance.plan_name = req.body.plan;
    insurance.policy_number = req.body.policy_number;
    insurance.policy_type = req.body.policy_type;
    insurance.group_number = req.body.group;
    insurance.copay = req.body.copay;

    let date = new Date(req.body.date);
    insurance.date = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    // Subscriber info
    insurance.subscriber_lname = req.body.lname;
    insurance.subscriber_mname = req.body.mname;
    insurance.subscriber_fname = req.body.fname;
    insurance.subscriber_sex = req.body.sex;
    insurance.subscriber_relationship = req.body.relationship;
    insurance.subscriber_ss = req.body.ss;

    date = new Date(req.body.dob);
    insurance.subscriber_DOB = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    insurance.subscriber_street = req.body.street;
    insurance.subscriber_postal_code = req.body.postal;
    insurance.subscriber_city = req.body.city;
    insurance.subscriber_state = req.body.state;
    insurance.subscriber_country = req.body.country;
    insurance.subscriber_phone = req.body.phone;
    // Employer info
    insurance.subscriber_employer = req.body.employer;
    insurance.subscriber_employer_street = req.body.estreet;
    insurance.subscriber_employer_postal_code = req.body.epostal;
    insurance.subscriber_employer_state = req.body.estate;
    insurance.subscriber_employer_country = req.body.ecountry;
    insurance.subscriber_employer_city = req.body.ecity;

    insurance.accept_assignment = "TRUE";


    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.sendInsurance({ pid: req.body.pid, token: token.token, org: req.session.org, 
                    type: req.params.type, insurance: insurance }, function() {
                        req.flash('success', 'Insurance Posted Successfully');
                        res.redirect('/patient/display/' + req.body.pid + '/insurance');
                });
            });
        }
    });
});

router.post('/insurance/:type/update', function(req, res) {
    let insurance = {};
    // Basic info
    insurance.type = req.params.type;
    insurance.provider = req.body.provider;
    insurance.plan_name = req.body.plan;
    insurance.policy_number = req.body.policy_number;
    insurance.policy_type = req.body.policy_type;
    insurance.group_number = req.body.group;
    insurance.copay = req.body.copay;

    let date = new Date(req.body.date);
    insurance.date = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    // Subscriber info
    insurance.subscriber_lname = req.body.lname;
    insurance.subscriber_mname = req.body.mname;
    insurance.subscriber_fname = req.body.fname;
    insurance.subscriber_sex = req.body.sex;
    insurance.subscriber_relationship = req.body.relationship;
    insurance.subscriber_ss = req.body.ss;

    date = new Date(req.body.dob);
    insurance.subscriber_DOB = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    insurance.subscriber_street = req.body.street;
    insurance.subscriber_postal_code = req.body.postal;
    insurance.subscriber_city = req.body.city;
    insurance.subscriber_state = req.body.state;
    insurance.subscriber_country = req.body.country;
    insurance.subscriber_phone = req.body.phone;
    // Employer info
    insurance.subscriber_employer = req.body.employer;
    insurance.subscriber_employer_street = req.body.estreet;
    insurance.subscriber_employer_postal_code = req.body.epostal;
    insurance.subscriber_employer_state = req.body.estate;
    insurance.subscriber_employer_country = req.body.ecountry;
    insurance.subscriber_employer_city = req.body.ecity;

    insurance.accept_assignment = "TRUE";

    emr.tokenValid(req.session.user, utils.getName(req.session.org), function(valid) {
        if (valid) {
            emr.getToken(req.session.user, utils.getName(req.session.org), function(token) {
                emr.updateInsurance({ pid: req.body.pid, token: token.token, org: req.session.org, 
                    type: req.params.type, insurance: insurance }, function() {
                        req.flash('success', 'Insurance Modification Successful');
                        res.redirect('/patient/display/' + req.body.pid + '/insurance');
                });
            });
        }
    });
});

module.exports = router;