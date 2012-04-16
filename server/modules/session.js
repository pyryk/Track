var restify = require('restify');
var Promise = require('node-promise').Promise;
var DateUtils = require('../modules/now.js');
var _ = require('underscore');
var Mongo = require('./mongo.js');

var Session = function() {

};

Session.fn = Session.prototype;

Session.fn.isAuthorized = function(fbUserId, fbAccessToken) {
    var promise = new Promise();

    if(fbUserId == null || fbUserId === '') {
        promise.reject();
        return promise;
    }

    if(fbAccessToken == null || fbAccessToken === '') {
        promise.reject();
        return promise;
    }

    // Get session and try to create new one if session doesn't exist
    var userSession = this.sessionStore.getValidSession(fbUserId, fbAccessToken);

    if(userSession) {
        this.sessionStore.renewSession(userSession);
        promise.resolve(userSession);
    } else {
        this.tryCreateSession(fbUserId, fbAccessToken).then(function(newSession) {
            promise.resolve(newSession);
        }, function() {
            promise.reject();
        });
    }

    return promise;
};

Session.fn.tryCreateSession = function(fbUserId, fbAccessToken) {
    var promise = new Promise();

    this.fbClient.getMe(fbAccessToken).then(function success(res) {
        // Verify fbUserId
        if(res.id == null || res.id !== fbUserId) {
            return promise.reject();
        }

        var newSession = this.sessionStore.createSession(fbUserId, fbAccessToken);
        this.updateUsersFacebookInformation(fbUserId, res)
        promise.resolve(newSession);
    }.bind(this), function error() {
        promise.reject();
    });

    return promise;
};

Session.fn.updateUsersFacebookInformation = function(fbUserId, getMeInformation) {
    var promise = new Promise();

    var informationToSave = {name: getMeInformation.name};

    Mongo.updateUsersFacebookInformation(fbUserId, informationToSave).then(function resolved() {
        promise.resolve();
    }, function rejected() {
        promise.reject();
    });

    return promise;
};

var FBClient = function() {
    this.client = FBClient.createClient();
};

FBClient.fn = FBClient.prototype;

FBClient.fn.getMe = function(fbAccessToken) {
    var promise = new Promise();

    this.client.get('/me?access_token=' + fbAccessToken, function(err, req, res, obj) {
        // https://graph.facebook.com/me?access_token=YOUR_USER_ACCESS_TOKEN
        if(err) {
            promise.reject();
        } else {
            promise.resolve(obj);
        }
    });

    return promise
}

FBClient.createClient = function() {
    return restify.createJsonClient({
        url: 'https://graph.facebook.com'
    });
}

var SessionStore = function() {
    this.timeout = 1000 * 60 * 30;
    this.store = [];
};

SessionStore.fn = SessionStore.prototype;

SessionStore.fn.getValidSession = function(fbUserId, fbAccessToken) {
    var session = _.find(this.store, function(sessionItem) {
        return sessionItem.fbUserId === fbUserId && sessionItem.fbAccessToken === fbAccessToken;
    });

    if(!session) {
        return null;
    }

    // Check if still valid
    if(session.sessionStarted > (DateUtils.now() - this.timeout)) {
        return session;
    } else {
        this.removeSession(fbUserId, fbAccessToken);
        return null;
    }
};

SessionStore.fn.createSession = function(fbUserId, fbAccessToken) {
    var newSession = {fbUserId: fbUserId, fbAccessToken: fbAccessToken, sessionStarted: DateUtils.now()};

    this.store.push(newSession);

    return newSession;
};

SessionStore.fn.renewSession = function(session) {
    session.sessionStarted = DateUtils.now();
};

SessionStore.fn.removeSession = function(session) {
    this.store = _.reject(this.store, function(sessionItem) {
        return sessionItem === session;
    });
};

SessionStore.fn.setTimeout = function(mins) {
    this.timeout = 1000 * 60 * mins;
};

SessionStore.fn.clean = function() {
    throw "SessionStore.clean not implemented";
};

module.exports = {
    Session: Session,
    SessionStore: SessionStore,
    FBClient: FBClient
};