var Mongo = require('../mongo');

Mongo.init(Mongo.profiles.test);

describe('Mongo', function() {

    var testDB = function(dbPromise, callback) {
        var promiseReturns;

        dbPromise.then(function() {
            promiseReturns = arguments;
        });

        waitsFor(function() {
            return promiseReturns;
        });

        runs(function() {
            callback.apply(this, promiseReturns);
        });
    }

    beforeEach(function() {
        Mongo.loadFixtures();
    });

    describe('findAllTargets', function() {

        it('should return list of all targets', function() {
            testDB(Mongo.findAllTargets(), function(dbResult) {
                expect(dbResult.length).toEqual(3);
            });
        });
    });

    describe('findTargetById', function() {
        it('should return details of specific target by id', function() {
            testDB(Mongo.findTargetById('12345678901234567890ABCD'), function(dbResult) {
                expect(dbResult.name).toEqual('Mikä fiilis?');
            });
        });
    });

    describe('createTarget', function() {
        it('should return details of specific target by id', function() {
            testDB(Mongo.createTarget('Virgin oil mikä meno?'), function() {
                expect(true).toBeTruthy(); // Ok, we are here
            });
        });
    });

});