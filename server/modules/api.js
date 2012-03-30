"use strict";

var Mongo = require('./mongo.js');
var Relevance = require('./relevance');
var _ = require('underscore');
var restify = require('restify');

var DateUtils = require('../modules/now.js');

var API = {

    rel: new Relevance(),

    start: function(server) {
        server.get("/targets", this.getTargets);
        server.get("/target/:id", this.getTarget);
        server.post("/target", this.postTarget);
        server.post("/target/:_id/result", this.postResult);
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

        var now = DateUtils.now();
        var minutes15 = 1000 * 60 * 15;
        var minutes15ago = new Date(now.getTime() - minutes15);

        var nowResults = {pos: 0, neg: 0, trend: 0, period: 15};
        var alltimeResults = {pos: 0, neg: 0};
        results.forEach(function(result) {
            var val = result.value;

            // Now
            if(result.timestamp.getTime() > minutes15ago) {
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
        Mongo.addResult(req.params).then(function() {
            res.send(204, null);
            return next();
        }, function(error) {
            return next(error);
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