const express = require('express');
const bcrypt = require('bcryptjs');
const emr = require('../services/emr');
const utils = require('../services/utils');
const blockchain = require('../services/blockchain');
const router = express.Router();

let User = require('../models/user');
let Login = require('../models/login');

// Renders HTML login with available organizations
router.get('/login', function(req, res) {
    let orgs = [];
    for (let i=0; i < utils.orgs.length; i++) {
        orgs.push({
            name: utils.getName(utils.orgs[i]),
            display: utils.orgs[i]
        });
    }
    res.render('login', {
        orgs: orgs
    });
})

// Login mechanics to use both EMR tokens and other users
router.post('/login', function(req, res) {
    let sess = req.session;
    if (utils.getRole(utils.getDomain(req.body.org)).indexOf('healthcare') > -1) {
        let obj = {};
        obj.user = req.body.usr.toLowerCase();
        obj.pass = req.body.pass;
        obj.org = utils.getDomain(req.body.org);
        emr.requestToken(obj, function(response) {
            // Check status message to display messages
            if (response.status === 401) {
                // Error message
                req.flash('danger', 'Unauthorized Access. Please Login');
                res.redirect('/users/login');
            } else if (response.status === 200) {
                sess.user = req.body.usr.toLowerCase();
                sess.org = utils.getDomain(req.body.org);
                res.redirect('/patient');
            }
        });
    } else {
        User.findOne({ "username": req.body.usr.toLowerCase(), "org": req.body.org }, function(err, user) {
            if (err) {
                console.log(err);
            } else {
                if (user !== null) {
                    bcrypt.compare(req.body.pass, user.password, function(err, isMatch) {
                        if (err) {
                            console.log(err); 
                        } else {
                            if (isMatch) {
                                sess.user = req.body.usr.toLowerCase();
                                sess.org = utils.getDomain(req.body.org);
                                blockchain.requestToken(req.body.usr, req.body.org);
                                res.redirect('/blockchain');
                            } else {
                                req.flash('danger', 'Unauthorized Access. Please Login');
                                res.redirect('/users/login');
                            }
                        }
                    });
                } else {
                    req.flash('danger', 'User not found. Please Register new user');
                    res.redirect('/users/register');
                }
            }
        });
    }
});

// Logout mechanics dependent on organization
router.get('/logout', function(req, res) {
    let sess = req.session;
    Login.findOneAndUpdate({ "user": sess.user, "terminated": '0', "org": utils.getName(sess.org) }, { sort: {date: -1}}, function(err, login) {
        login.terminated = '1';
        login.save();
    });
    sess.user = null;
    sess.org = null;
    req.flash('success', 'Logout Successful');
    res.redirect('/users/login');
});

// Renders HTML register form for non-healthcare roles
router.get('/register', function(req, res) {
    if (res.locals.role.indexOf('healthcare') > -1) {
        res.redirect('/');
    } else {
        let obj = [];
        orgs = utils.nonHealthOrgs();
        orgs.forEach(function(org, i) {
            obj.push({
                name: org,
                display: utils.getDomain(org)
            });
            if (i === (orgs.length - 1)) {
                res.render('register', {
                    orgs: obj
                });
            }
        });
    }
})

// Register mechanics
router.post('/register', function(req, res) {
    if (req.body.pass !== req.body.pass2) {
        req.flash('danger', "Passwords do not match");
        res.redirect('/users/register');
    } else {
        User.find({ "username": req.body.usr, "org": req.body.org }, function(err, users) {
            if (err) {
                console.log(err);
            } else {
                if (users.length === 0) {
                    let user = new User();
                    user.name = req.body.name;
                    user.org = req.body.org;
                    user.username = req.body.usr;
    
                    bcrypt.genSalt(10, function(err, salt) {
                        if (err) {
                            console.log(err);
                        } else {
                            bcrypt.hash(req.body.pass, salt, function(err, hash) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    user.password = hash;
                                    user.save(function(err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            req.flash('success', "User registered successfully")
                                            res.redirect('/users/login');
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    req.flash('danger', "Username already exists");
                    res.redirect('/users/register');
                }
            }
        });
    }
});

module.exports = router;