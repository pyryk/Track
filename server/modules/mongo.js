var mongoose = require('mongoose');
var Promise = require('node-promise').Promise;
var Fixtures = require('../fixtures/fixtures');
var DateUtils = require('../modules/now.js');
var _ = require('underscore');

var Mongo = {

    profiles: {
        dev: {db: "mongodb://localhost/track"},
        test: {db: "mongodb://localhost/track_test"}
    },

    init: function(profile) {
        profile = profile || this.profiles.dev;

        mongoose.connect(profile.db);

        var Target = new mongoose.Schema({
            name: String,
            question: String,

            createdLocation: {
                lat: Number
                , lon: Number
            },
            results: [{
                timestamp: Date
                , value: Number
                , fbUserId: String
                , location: {
                    lat: Number
                    , lon: Number
                }
            }]
        });

        mongoose.model('Target', Target);
        this.Target = mongoose.model('Target');
    },

    loadFixtures: function() {

        this.Target.remove({}, function() {});

        Fixtures.targets.forEach(function(targetHash) {
            var target = new this.Target();

            for(key in targetHash) {
                target[key] = targetHash[key];
            }

            if(target.results) {
                var results = target.results;
                for(var i = 0, len = results.length; i < len; i++) {
                    if(results[i].timestamp) {
                        continue;
                    }

                    var value = results[i];
                    var timestamp = new Date();
                    results[i] = {value: value, timestamp: timestamp};
                }
            };

            target.save(function(error) {
                if(error) {
                    console.error(error);
                }
            });
        }, this);
    },

    findAllTargets: function() {
        var promise = Promise();

        this.Target.find({}, function(error, data) {
            this.resolvePromise(error, data, promise)
        }.bind(this));

        return promise;
    },

    findTargetById: function(id) {
        var promise = Promise();

        this.Target.findById(id, function(error, data) {
            this.resolvePromise(error, data, promise)
        }.bind(this));

        return promise;
    },

    countTargetsUserTracked: function(fbUserId) {
        var promise = Promise();

        this.Target.find({'results.fbUserId': fbUserId}, function(error, data) {
            var length = 0;
            if(_.isArray(data)) {
                length = data.length;
            }

            this.resolvePromise(error, length, promise);

        }.bind(this));

        return promise;
    },

    createTarget: function(params) {
        var promise = Promise();

        var target = new this.Target();
        target.name = params.name;
        target.question = params.question;

        var loc = params.location;
        if(loc) {
            target.createdLocation = {lat: loc.lat, lon: loc.lon};
        }

        target.save(function(error) {
            var id = target._id;
            this.resolvePromise(error, id, promise)
        }.bind(this));

        return promise;
    },

    addResult: function(params) {
        var promise = Promise();

        this.findTargetById(params._id).then(function(target) {
            if(!target.results) {
                target.results = [];
            }

            var result = {timestamp: DateUtils.now(), value: params.value};
            if(params.fbUserId) {
                result.fbUserId = params.fbUserId;
            }

            var loc = params.location;
            if(loc) {
                result.location = {lat: loc.lat, lon: loc.lon};
            }

            target.results.push(result);

            target.save(function(error) {
                Mongo.resolvePromise(error, promise);
            }.bind(this));

        }, function(error) {
            this.resolvePromise(error, promise);
        })

        return promise;
    },

    resolvePromise: function(error) {
        var data, promise;

        if(arguments.length === 3) {
            data = arguments[1];
            promise = arguments[2];
        }

        if(arguments.length === 2) {
            promise = arguments[1];
        }

        if(error) {
            promise.reject(error);
        } else {
            promise.resolve(data);
        }
    }

}

module.exports = Mongo;