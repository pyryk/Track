"use strict";

var Mongo = require('./mongo.js');
var Relevance = require('./relevance');
var _ = require('underscore');
var restify = require('restify');
var Response = require('restify').Response;
var Session = require('./session').Session;
var FBClient = require('./session').FBClient;
var SessionStore = require('./session').SessionStore;
var Promise = require('node-promise').Promise;

var DateUtils = require('../modules/now.js');

var API = {

    rel: new Relevance(),
    session: new Session(),

    start: function(server) {
        this.server = server;
        this.session.sessionStore = new SessionStore;
        this.session.fbClient = new FBClient();

        // Headers
        this.initializeHeaders();

        // Put the handler inside closure to allow mocking
        server.use(function(req, res, next) {
            this.preAuth(req, res, next);
        }.bind(this));

        // A little tweak to allow optional auth per route
        ['del', 'get', 'head', 'post', 'put'].forEach(function(method) {
            this[method] = function(path, handler, requireAuth) {
                this.server[method](path, function(req, res, next) {
                    this.authorize(req, res, next, handler, requireAuth);
                }.bind(this));
            }
        }.bind(this));

        this.get("/targets", this.getTargets, false);
        this.get("/target/:id", this.getTarget, true);
        this.post("/target", this.postTarget, true);
        this.post("/target/:_id/result", this.postResult, true);
        this.get("/login", this.getLogin, true);
    },

    authorize: function(req, res, next, handler, requireAuth) {
        if(requireAuth) {
            if(!req.authorization || !req.authorization.fbUserId) {
                return next(new restify.NotAuthorizedError("Not logged in"));
            }
        }
        handler(req, res, next);
    },

    initializeHeaders: function() {
        API.defaultHeaders = Response.prototype.defaultHeaders;
        var extendHeaders = this.extendHeaders;
        restify.defaultResponseHeaders = function(data) {
            // 'this' is response object
            var res = this;

            // Run the node-restify default method
            API.defaultHeaders.apply(res, data);

            // Extend with own headers
            extendHeaders(res);
        }
    },

    extendHeaders: function(res) {
        var newAllowedHeaders = 'FB-UserId, FB-AccessToken';
        var allowedHeaders = res.headers['access-control-allow-headers'] || "";
        allowedHeaders += (allowedHeaders.length ? ', ' : '') + newAllowedHeaders;

        res.header('Access-Control-Allow-Headers', allowedHeaders);
    },

    preAuth: function(req, res, next) {
        var fbUserId = req.headers['fb-userid'];
        var fbAccessToken = req.headers['fb-accesstoken'];

        API.session.isAuthorized(fbUserId, fbAccessToken).then(function(userSession) {
            var authorization = API.selectFields(userSession, ['fbUserId', 'sessionStarted']);
            req.authorization = authorization;
            return next();
        }, function() {
            return next();
        });
    },

    getTargets: function(req, res, next) {
        var rel = API.rel;
        var debugging = req.headers['debug'] === 'true';

        Mongo.findAllTargets().then(function(data) {
            var targets = data;
            rel.calculate(targets);

            // Filter
            var selectedFields = ['name', '_id', 'question', 'relevance'];

            if(debugging) {
                selectedFields.push('relevanceFrom');
            }

            targets = data.map(function(target) {
                return API.selectFields(target, selectedFields);
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
    },

    postTarget: function(req, res, next) {
        Mongo.createTarget(req.params).then(function(id) {
            res.send(201, {_id: id});
            return next();
        }, function(error) {
            return next(error);
        });
    },

    postResult: function(req, res, next) {
        var result = {_id: req.params._id, value: req.params.value, fbUserId: req.authorization.fbUserId};

        Mongo.addResult(result).then(function() {
            res.send(204, null);
            return next();
        }, function(error) {
            return next(error);
        });
    },

    getLogin: function(req, res, next) {
        var body = req.authorization;

        res.send(200, body);
        return next();
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