var mongoose = require('mongoose');
var Promise = require('node-promise').Promise;
var Fixtures = require('./fixtures');

var Mongo = {

    profiles: {
        dev: {db: "mongodb://localhost/track"},
        test: {db: "mongodb://localhost/track_test"}
    },

    init: function(profile) {
        profile = profile || this.profiles.dev;

        mongoose.connect(profile.db);

        var TargetModel = {
            name    : String
        };

        var Target = new mongoose.Schema(TargetModel);
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

    createTarget: function(name) {
        var promise = Promise();

        var target = new this.Target();
        target.name = name;

        target.save(function(error) {
            this.resolvePromise(error, promise)
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