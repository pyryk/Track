"use strict";

var Mongo = require('./mongo.js');
var Relevance = require('./relevance');
var _ = require('underscore');

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

    categoriseResults: function(results) {
        results = results || [];

        var nearestStartingQuarter = function(date) {
            var minutes = date.getMinutes() % 15;
            var seconds = date.getSeconds();
            var milliseconds = date.getMilliseconds();

            var substract = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;

            return new Date(date.getTime() - substract);
        };

        var addQuarter = function(date) {
            return new Date(date.getTime() + (1000 * 60 * 15));
        }

        var quarters = {};
        results.forEach(function(result) {
            var startQuarter = nearestStartingQuarter(result.timestamp).getTime();

            var quarterResult = quarters[startQuarter] || {pos: 0, neg: 0};

            if(result.value) {
                quarterResult.pos++;
            } else {
                quarterResult.neg++;
            }

            quarters[startQuarter] = quarterResult;
        });

        if(_.isEmpty(quarters)) {
            return null;
        }

        var history = [];
        _.each(quarters, function(quarterValue, quarterKey) {
            var quarterStart = new Date(parseInt(quarterKey, 10));
            var quarterEnd = addQuarter(quarterStart);
            history.push({start: quarterStart, end: quarterEnd, pos: quarterValue.pos, neg: quarterValue.neg});
        });

        return history;
    },

    getTarget: function(req, res, next) {
        Mongo.findTargetById(req.params.id).then(function(data) {

            // Filter
            var target = API.selectFields(data, ['name', '_id', 'question']);

            var history = API.categoriseResults(data.results);

            if(history) {
                target.results = {history: history};
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
        var selectedFields = {};

        fields.forEach(function(value) {
            selectedFields[value] = obj[value];
        });

        return selectedFields;
    }
}

module.exports = API;