var mongoose = require('mongoose')
var Promise = require('node-promise').Promise;

var Mongo = {

    init: function() {
        mongoose.connect('mongodb://localhost/track');

        var TargetModel = {
            name    : String
        };

        var Target = new mongoose.Schema(TargetModel);
        mongoose.model('Target', Target);
        this.Target = mongoose.model('Target');
    },

    deleteAll: function() {
        // CAREFUL WITH THIS ONE!
        this.Target.remove({}, function() {
            console.log('All removed!');
        });
    },

    createSampleData: function() {
        var targets = [{
            name: 'T-Talon ruokajono'
        }, {
            name: 'Mikä fiilis?'
        }, {
            name: 'Putouksen munamiehen läpän taso'
        }]

        targets.forEach(function(targetHash) {
            var target = new this.Target();
            target.name = targetHash.name;

            target.save(function(error) {
                if(error) {
                    console.error(error);
                } else {
                    console.log('Saved sample target: [name: ' + target.name + ', id: ' + target.id + ']');
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