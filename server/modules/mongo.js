var mongoose = require('mongoose');
var p = require("promised-io/promise");
var Promise = p.Promise;
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
            creatorFbUserId: String,

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

        var User = new mongoose.Schema({
            fbUserId: String,
            fbInformation: {
                name: String
            },
            points: Number
        });

        mongoose.model('User', User);
        this.User = mongoose.model('User');
    },

    loadFixtures: function() {
        var fixturesSaved = new Promise();

        // ... Targets ... //
        var Target = this.Target;
        Target.remove({}, function() {});

        var savePromises = [];

        Fixtures.targets.forEach(function(targetHash) {
            var target = new Target();

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

            var targetSaved = new Promise();

            target.save(function(error) {
                if(error) {
                    console.error(error);
                    return targetSaved.reject();
                }

                targetSaved.resolve();
            });

            savePromises.push(targetSaved)
        });

        // ... Users ... //

        var User = this.User;
        User.remove({}, function() {

            Fixtures.users.forEach(function(userHash) {
                var user = new User();

                for(key in userHash) {
                    user[key] = userHash[key];
                }

                var userSaved = new Promise();

                user.save(function(error) {
                    if(error) {
                        console.error(error);
                        return userSaved.reject();
                    }

                    userSaved.resolve();
                });

                savePromises.push(userSaved);
            });

        });

        p.all(savePromises).then(function success() {
            fixturesSaved.resolve();
        }, function error() {
            throw "Failed to load fixtures";
        });

        return fixturesSaved;

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

        if(params.fbUserId) {
            target.creatorFbUserId = params.fbUserId;
        }

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

    deleteTarget: function(target) {

        var promise = Promise();

        target.remove(function(error) {
            Mongo.resolvePromise(error, promise)
        }.bind(this));


        return promise;


    },

    deleteTargetById: function(targetId) {

        var promise = Promise();

        this.Target.remove({_id: targetId}, function(error) {
            Mongo.resolvePromise(error, promise)
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

    updateUsersFacebookInformation: function(fbUserId, fbInformation) {
        var promise = Promise();

        this.findOrCreateUserByFBUserId(fbUserId).then(function(user) {
            user.fbInformation = fbInformation;

            user.save(function(error) {
                Mongo.resolvePromise(error, promise);
            });
        });

        return promise;
    },

    findUserByFBUserId: function(fbUserId) {
        var promise = new Promise();

        this.User.findOne({fbUserId: fbUserId}, function(error, data) {
            this.resolvePromise(error, data, promise)
        }.bind(this));

        return promise;
    },

    findOrCreateUserByFBUserId: function(fbUserId) {
        var promise = new Promise();

        this.User.findOne({fbUserId: fbUserId}, function(error, data) {
            if(data) {
                return this.resolvePromise(error, data, promise);
            }

            var user = new this.User();
            user.fbUserId = fbUserId;

            user.save(function(error) {
                this.resolvePromise(error, user, promise)
            }.bind(this));

        }.bind(this));

        return promise;
    },

    addPoints: function(fbUserId, points) {
        var promise = new Promise();

        var findUser = this.findOrCreateUserByFBUserId(fbUserId);

        findUser.then(function success(user) {
            var userPoints = user.points || 0;
            userPoints += points;
            user.points = userPoints;

            user.save(function(error) {
                this.resolvePromise(error, user, promise);
            }.bind(this));

        }.bind(this), function error(err) {
            this.resolvePromise(err);
        }.bind(this));

        return promise;
    },

    findUsersWithMostPoints: function() {
        var promise = new Promise();

        this.User.find({points: { $gt: 0}}, null, {skip:0, limit:10, sort: {points: -1}}, function(error, data) {
            return this.resolvePromise(error, data, promise);
        }.bind(this));

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