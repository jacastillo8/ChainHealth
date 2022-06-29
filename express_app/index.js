const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const https = require('https');
const fs = require('fs');

const utils = require('./services/utils');

// Deprecation Warnings removed
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect('mongodb://localhost:27017/Blockchain');
let db = mongoose.connection;

// Check DB connection
db.once('open', function(){
    console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
    console.log(err);
});

db.on('disconnected', function() {
    console.log('MongoDB Disconnected');
})

// Terminate all open sessions
let Login = require('./models/login');
Login.updateMany({ "terminated": '0' }, { "terminated": '1' }, {multi: true}, function(err, logins) {
    if (err) {
        console.log(err);
    } else {
        return
    }
});

// Clean temp folder
fs.readdir('temp', function(err, items) {
    items.forEach(function(item) {
        if (item !== '.gitkeep') {
            fs.unlink('temp/' + item, function(err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
});

// Remove expired (creation time > 1h) files every 10mins
setInterval(function() {
    fs.readdir('temp', function(err, items) {
        items.forEach(function(item) {
            if (item !== '.gitkeep') {
                var name = item.split('.')[0];
                if (Number(Date.now()) - Number(name) > 3600000) {
                    fs.unlink('temp/' + item, function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                } 
            }
        });
    });
}, 600000);

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
secret = utils.session();
app.use(session({
    secret: secret,
    resave: true,
    saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Setting EJS engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('*', function(req, res, next) {
    let sess = req.session;
    res.locals.user = sess.user || null;
    res.locals.org = sess.org || null;
    res.locals.role = '';
    if (res.locals.org !== null) {
        res.locals.role = utils.getRole(res.locals.org);
        sess.role = res.locals.role;
        if (res.locals.role.indexOf('healthcare') === -1) {
            res.locals.service = null;
        } else {
            res.locals.service = utils.EMRService(res.locals.org);
        }
    }
    res.locals.no_health_users = utils.nonHealthOrgs();
    next();
});

app.get('/', function(req, res){
    res.render('home');
});

// Routes
let users = require('./routes/users');
let api = require('./routes/emr');
let patient = require('./routes/patient');
let blockchain = require('./routes/blockchain');
let mqtt = require('./routes/mqtt');

app.use('/users', users);
app.use('/patient', patient);
app.use('/api', api);
app.use('/blockchain', blockchain);
app.use('/devices', mqtt);


if (utils.tls) {
    https.createServer({
        key: fs.readFileSync('./config/key.pem'),
        cert: fs.readFileSync('./config/cert.pem'),
        passphrase: "ChainHealth"
    }, app).listen(utils.port);
} else {
    app.listen(utils.port, function(){
        console.log('Serving ChainHealth!...');
    });
}