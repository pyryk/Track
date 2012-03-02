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

        this.Target.remove({}, function() {
            console.log('All removed!');
        });

        Fixtures.targets.forEach(function(targetHash) {
            var target = new this.Target();
            target.name = targetHash.name;

            target.save(function(error) {
                if(error) {
                    console.error(error);
                } else {
                    console.log('Saved fixture target: [name: ' + target.name + ', id: ' + target.id + ']');
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

    resolvePromise: function(error, data, promise) {
        if(error) {
            promise.reject(error);
        } else {
            promise.resolve(data);
        }
    }

}

module.exports = Mongo;