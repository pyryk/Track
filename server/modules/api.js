"use strict";

var Mongo = require('./mongo.js');
var Relevance = require('./relevance');
var _ = require('underscore');
var restify = require('restify');
var Session = require('./session').Session;
var FBClient = require('./session').FBClient;
var SessionStore = require('./session').SessionStore;
var Promise = require('node-promise').Promise;

var DateUtils = require('../modules/now.js');

var API = {

    rel: new Relevance(),
    session: new Session(),

    start: function(server) {
        this.session.sessionStore = new SessionStore;
        this.session.fbClient = new FBClient();

        server.get("/targets", this.getTargets);
        server.get("/target/:id", this.getTarget);
        server.post("/target", this.postTarget);
        server.post("/target/:_id/result", this.postResult);
        server.get("/login", this.getLogin);
    },

    authorize: function(req) {
        var promise = new Promise();

        var fbUserId = req.headers['fb-userid'];
        var fbAccessToken = req.headers['fb-accesstoken'];

        API.session.isAuthorized(fbUserId, fbAccessToken).then(function(userSession) {
            var authorization = API.selectFields(userSession, ['fbUserId', 'sessionStarted']);
            promise.resolve(authorization);
        }, function() {
            promise.reject();
        });

        return promise;
    },

    getTargets: function(req, res, next) {
        var rel = API.rel;

        Mongo.findAllTargets().then(function(data) {
            var targets = data;
            rel.calculate(targets);

            // Filter
            targets = data.map(function(target) {
                return API.selectFields(target, ['name', '_id', 'question', 'relevance']);
            });

            // Sort
            targets.sort(function(a, b) {
                var aRel = a.relevance, bRel = b.relevance;
                if(aRel > bRel) {
                    return -1;
                } else if(aRel === bRel) {
                    return 0;
                } else {
                    return 1;
                }
            });

            res.send(200, {targets: targets});
            return next();
        }, function(error) {
            return next(error);
        });
    },

    aggregateResults: function(results) {

        if(!_.isArray(results)) {
            return null;
        }

        // Times
        var now = DateUtils.now();
        var period = 1000 * 60 * 15;
        var nowPeriod = new Date(now.getTime() - period);
        var pastPeriod = new Date(now.getTime() - (2 * period));

        // Results
        var pastResults = {pos: 0, neg: 0}
        var nowResults = {pos: 0, neg: 0, trend: 0, period: 15};
        var alltimeResults = {pos: 0, neg: 0};

        // Iterate and analyze
        results.forEach(function(result) {
            var val = result.value;
            var timestamp = result.timestamp;

            // Past
            if(timestamp > pastPeriod && timestamp < nowPeriod) {
                if(val) {
                    pastResults.pos++;
                } else {
                    pastResults.neg++;
                }
            }

            // Now
            if(timestamp > nowPeriod) {
                if(val) {
                    nowResults.pos++;
                } else {
                    nowResults.neg++;
                }
            }

            // Alltime
            if(val) {
                alltimeResults.pos++;
            } else {
                alltimeResults.neg++;
            }
        });

        var pastResultsPercentage = pastResults.pos / (pastResults.pos + pastResults.neg);
        var nowResultsPercentage = nowResults.pos / (nowResults.pos + nowResults.neg);
        var change = nowResultsPercentage - pastResultsPercentage;


        var trend;

        if(change <= -0.2) {
            trend = -3;
        } else if (change <= -0.1) {
            trend = -2;
        } else if (change < 0) {
            trend = -1;
        } else if (change === 0) {
            trend = 0;
        } else if (change < 0.1) {
            trend = 1;
        } else if (change < 0.2) {
            trend = 2;
        } else if (change >= 0.2) {
            trend = 3;
        } else {
            trend = 0;
        }


        nowResults.trend = trend;

        return {alltime: alltimeResults, now: nowResults};
    },

    getTarget: function(req, res, next) {
        API.authorize(req).then(function(session) {
            Mongo.findTargetById(req.params.id).then(function(data) {
                if(data == null) {
                    return next(new restify.ResourceNotFoundError("Could not find target with ID " + req.params.id));
                }

                // Filter
                var target = API.selectFields(data, ['name', '_id', 'question']);

                // Aggregate
                var aggregatedResults = API.aggregateResults(data.results);

                if(aggregatedResults) {
                    target.results = aggregatedResults;
                }

                res.send(200, {target: target});

                return next();
            }, function(error) {
                return next(error);
            });
        }, function error() {
            return next(new restify.NotAuthorizedError("Not logged in"));
        });
    },

    postTarget: function(req, res, next) {
        API.authorize(req).then(function(session) {
            Mongo.createTarget(req.params).then(function(id) {
                res.send(201, {_id: id});
                return next();
            }, function(error) {
                return next(error);
            });
        }, function error() {
            return next(new restify.NotAuthorizedError("Not logged in"));
        });
    },

    postResult: function(req, res, next) {
        API.authorize(req).then(function(session) {
            Mongo.addResult(req.params).then(function() {
                res.send(204, null);
                return next();
            }, function(error) {
                return next(error);
            });
        }, function error() {
            return next(new restify.NotAuthorizedError("Not logged in"));
        });
    },

    getLogin: function(req, res, next) {
        API.authorize(req).then(function(session) {
            var body = API.selectFields(session, ['fbUserId', 'sessionStarted']);

            res.send(200, body);
            return next();
        }, function error() {
            return next(new restify.NotAuthorizedError("Not logged in"));
        });
    },

    selectFields: function(obj, fields) {
        if(obj == null) {
            return null;
        }

        var selectedFields = {};

        fields.forEach(function(value) {
            selectedFields[value] = obj[value];
        });

        return selectedFields;
    }
}

module.exports = API;