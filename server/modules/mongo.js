var mongoose = require('mongoose');
var p = require("promised-io/promise");
var Promise = p.Promise;
var Fixtures = require('../fixtures/fixtures');
var DateUtils = require('../modules/now.js');
var _ = require('underscore');
var restify = require('restify');

var Mongo = {

    profiles: {
        dev: {db: "mongodb://localhost/track"},
        test: {db: "mongodb://localhost/track_test"}
    },

    init: function(profile) {
        profile = profile || this.profiles.dev;

        mongoose.connect(profile.db);

        var ObjectId = mongoose.Schema.ObjectId;

        var Question = new mongoose.Schema({
            name: String
        });

        var Target = new mongoose.Schema({
            name: String,
            questions: [Question],
            questionType: String,
            showQuestionComment: Boolean,

            location: {
                lat: Number
                , lon: Number
            },
            customerId: ObjectId

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



        var Result = new mongoose.Schema({
            questionId: ObjectId,
            timestamp: Date
            , value: Number
            , textComment: String
            , fbUserId: String
            , location: {
                lat: Number
                , lon: Number
            }
         });

        mongoose.model('Result', Result);
        this.Result = mongoose.model('Result');

        var Customer = new mongoose.Schema({
            name: String
        });

        mongoose.model('Customer', Customer);
        this.Customer = mongoose.model('Customer');

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

    findTargets: function(customerId) {
        var promise = Promise();

        this.Target.find((!!customerId ? {customerId: customerId} : {}), function(error, data) {
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

        this.Result.find({'fbUserId': fbUserId}, function(error, data) {
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
        target.customerId = params.customerId;
        target.questionType = params.questionType;
        target.showQuestionComment = params.showQuestionComment;

        for (questionItem in params.questions) {
            target.questions.push(params.questions[questionItem]);
        }

        var loc = params.location;
        if(loc) {
            target.location = {lat: loc.lat, lon: loc.lon};
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

        Mongo.findTargetById(targetId).then(function(data) {
            if(data == null) {
                Mongo.resolvePromise(new restify.ResourceNotFoundError("Could not find target with ID " + targetId)
                    , data, promise);
            } else {
                Mongo.deleteTarget(data).then(function error(err) {
                    Mongo.resolvePromise(err, data, promise);
                })
            }
         });

        return promise;
    },


    addResult: function(params) {
        var promise = Promise();
        var result = new this.Result();

        result.questionId = params.questionId;
        result.timestamp = DateUtils.now();
        result.value = params.value;
        result.textComment = params.textComment;

        if(params.fbUserId) {
            result.fbUserId = params.fbUserId;
        }

        var loc = params.location;
        if(loc) {
            result.location = {lat: loc.lat, lon: loc.lon};
        }

        result.save(function(error) {
            var id = result._id;
            this.resolvePromise(error, id, promise)
        }.bind(this));

        return promise;
    },


    // Fixed for textComment. Should be reimplemented.
    updateResult: function(params) {
      var promise = Promise();

      this.findResultById(params.resultId).then(function success(foundResult) {
          foundResult.textComment = params.textComment;
          foundResult.save(function(error) {
              var id = foundResult._id;
              Mongo.resolvePromise(error, id, promise);
          }.bind(this));
      })

        return promise;
    },

    findResultById: function(resultId) {
        var promise = Promise();
        console.log(resultId);

        this.Result.findOne({_id: resultId}, function(error, data) {
            Mongo.resolvePromise(error, data, promise)
        });

        return promise;

    },

    findResultsByQuestionId: function(id) {
        var promise = Promise();

        this.Result.find({questionId: id}, function(error, data) {
            this.resolvePromise(error, data, promise)
        }.bind(this));

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

    findAllCustomers: function() {
        var promise = Promise();

        this.Customer.find({}, function(error, data) {
            this.resolvePromise(error, data, promise)
        }.bind(this));

        return promise;
    },

    createCustomer: function(params) {
        var promise = Promise();
        var customer = new this.Customer();

        customer.name = params.name;

        customer.save(function(error) {
            var id = customer._id;
            this.resolvePromise(error, id, promise)
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