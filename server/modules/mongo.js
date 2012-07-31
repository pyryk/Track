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
            name: String,
            targetId: ObjectId
        });

        mongoose.model('Question', Question);
        this.Question = mongoose.model('Question');

        var Target = new mongoose.Schema({
            name: String,
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

    findTargets: function(field, value) {
        var promise = Promise();

        var query = this.Target.find({});

        if (!!field && !!value) {
            query.where(field, value);
        }

        query.exec(function(error, data) {
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
    updateResult: function(params, updatedFields) {
      var promise = Promise();

      this.findResults('_id', params.id).then(function success(data) {
          var foundResult = data[0];

          if(!foundResult) {
              Mongo.resolvePromise(new restify.ResourceNotFoundError(
                  "Could not find result with ID " + params.id)
                  , data, promise);
          } else {
              for (var i in updatedFields) {
                  foundResult[updatedFields[i]] = params[updatedFields[i]];
              }

              foundResult.save(function(error) {
                  var id = foundResult._id;
                  Mongo.resolvePromise(error, id, promise);
              }.bind(this));
          }
      })

        return promise;
    },

    findQuestions: function(field, value) {
        var promise = Promise();

        var query = this.Question.find({});

        if (!!field && !!value) {
            query.where(field, value);
        }

        query.exec(function(error, data) {
            this.resolvePromise(error, data, promise)
        }.bind(this));

        return promise;
    },

    findQuestionById: function(id) {
        var promise = Promise();

        this.Question.findById(id, function(error, data) {
           Mongo.resolvePromise(error, data, promise);
        }.bind(this));

        return promise;
    },

    findResults: function(field, value) {
        var promise = Promise();

        var query = this.Result.find({});

        if (!!field && !!value) {
            query.where(field, value);
        }

        query.exec(function(error, data) {
            this.resolvePromise(error, data, promise)
        }.bind(this));

        return promise;
    },

    findResultById: function(id) {
        var promise = Promise();

        this.Result.findById(id, function(error, data) {
            Mongo.resolvePromise(error, data, promise);
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

    findCustomers: function(field, value) {
        var promise = Promise();

        var query = this.Customer.find({});

        if (!!field && !!value) {
            query.where(field, value);
        }

        query.exec(function(error, data) {
            this.resolvePromise(error, data, promise)
        }.bind(this));

        return promise;
    },

    findCustomerById: function(id) {
        var promise = Promise();

        this.Customer.findById(id, function(error, data) {
            Mongo.resolvePromise(error, data, promise);
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

    deleteCustomer: function(customer) {

        var promise = Promise();

        customer.remove(function(error) {
            Mongo.resolvePromise(error, promise)
        }.bind(this));

        return promise;

    },

    deleteCustomerById: function(customerId) {

        var promise = Promise();

        Mongo.findCustomers('_id', customerId).then(function(data) {
            if(!data) {
                Mongo.resolvePromise(new restify.ResourceNotFoundError("Could not find customer with ID " + customerId)
                    , data, promise);
            } else {
                var customer = data[0];
                Mongo.deleteCustomer(customer).then(function error(err) {
                    Mongo.resolvePromise(err, customer, promise);
                })
            }
        });

        return promise;
    },


    createQuestion: function(params) {
        var promise = Promise();
        var question = new this.Question();

        question.name = params.name;
        question.targetId = params.targetId;

        question.save(function(error) {
            var id = question._id;
            this.resolvePromise(error, id, promise)
        }.bind(this));

        return promise;
    },

    deleteQuestion: function(question) {

        var promise = Promise();

        question.remove(function(error) {
            Mongo.resolvePromise(error, promise)
        }.bind(this));

        return promise;

    },

    deleteQuestionById: function(questionId) {

        var promise = Promise();

        Mongo.findQuestions('_id', questionId).then(function(data) {
            if(!data) {
                Mongo.resolvePromise(new restify.ResourceNotFoundError("Could not find question with ID " + questionId)
                    , data, promise);
            } else {
                var question = data[0];
                Mongo.deleteQuestion(question).then(function error(err) {
                    Mongo.resolvePromise(err, question, promise);
                })
            }
        });

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