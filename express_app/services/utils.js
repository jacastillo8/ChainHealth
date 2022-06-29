const yaml = require('js-yaml');
const fs = require('fs');

let file = fs.readFileSync('./config.yaml', 'utf8');
let app = yaml.safeLoad(file).application;
let services = yaml.safeLoad(file).services;

let port = app.port;
let host = app.host;
let tls = app.tls;
let session = app.session_secret;
let jwt = app.jwt_secret;

let domains = Object.keys(services).filter(item => item !== 'Blockchain');

function getBlockchainData() {
    if (verify('Blockchain'))
        return services['Blockchain'];
    return null;
}

// Get EMR Data w.r.t organization
function getEMRData(orgDomain) {
    if (verify(orgDomain)) {
        return services[orgDomain].emr;
    }
    return null;
}

// Get Broker Data w.r.t organization
function getBrokerData(orgDomain) {
    if (verify(orgDomain)) {
        return services[orgDomain].broker;
    }
    return null;
}

// Gets organization role
function getRole(orgDomain) {
    if (verify(orgDomain)) {
        return services[orgDomain].role;
    }
    return null;
}

function getBlockchainService() {
    let bc = getBlockchainData();
    if (bc === null)
        return false;
    return `http://${bc.host}:${bc.port}/api/${bc.bid}/${bc.cid}`;
}

// Gets EMR Service data
function getEMRService(orgDomain) {
    let emr = getEMRData(orgDomain);
    if (emr === null) {
        return false;
    }
    return 'http://' + emr.host + ':' + emr.port + '/' + emr.address;
}

// Gets Broker Service data
function getBrokerService(orgDomain) {
    let broker = getBrokerData(orgDomain);
    if (broker === null) {
        return false;
    }
    if (broker.tls) {
        return 'mqtts://' + host + ':' + broker.port;
    }
    return 'mqtt://' + host + ':' + broker.port;
}

// Helper function to aid that data exists
function verify(orgDomain) {
    if (orgDomain !== null) {
        let data = services[orgDomain];
        if (data === 'undefined') {
            return false;
        }
        return true;
    }
    return false;
}

// Gets organizations not related to healthcare
function nonHealthOrgs() {
    let viable_orgs = [];
    for (let i=0; i < domains.length; i++) {
        if (getRole(domains[i]).indexOf('healthcare') === -1) {
            viable_orgs.push(getName(domains[i]));
        }
    }
    return viable_orgs;
}

// Gets name of service w.r.t organization
function getName(orgDomain) {
    if (verify(orgDomain)) {
        return services[orgDomain].name;
    }
    return null;
}

// Gets session secret
function getSession() {
    return session;
}

// Gets token's secret
function getJWT() {
    return jwt;
}

// Gets domain from name
function getDomain(name) {
    for (let i=0; i < domains.length; i++) {
        if (services[domains[i]].name === name) {
            return domains[i];
        }
    }
    return null;
}

function getBrokerCAPath(org) {
    let broker = getBrokerData(getDomain(org));
    return broker.ca_cert_path;
}

function getAvailableTransactions() {
    return ['all', 'ins', 'iss', 'med', 'pat', 'sur', 'vit'];
}

function getTransactionMap() {
    return {
        all: "allergy",
        ins: "insurance",
        iss: "issue",
        med: "medication",
        pat: "patient",
        sur: "surgery",
        vit: "vitals"
    };
}

module.exports.port = port;
module.exports.host = host;
module.exports.orgs = domains;
module.exports.tls = tls;
module.exports.session = getSession;
module.exports.jwt = getJWT;
module.exports.getDomain = getDomain;
module.exports.getRole = getRole;
module.exports.BCService = getBlockchainService;
module.exports.EMRService = getEMRService;
module.exports.BrokerService = getBrokerService;
module.exports.BrokerCert = getBrokerCAPath;
module.exports.nonHealthOrgs = nonHealthOrgs;
module.exports.getName = getName;
module.exports.getAvailableTransactions = getAvailableTransactions;
module.exports.getTransactionMap = getTransactionMap;