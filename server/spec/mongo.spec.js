var Mongo = require('../mongo');
var MongoHelpers = require('./helpers').Mongo;

// Helper methods for Mongo testing
var testDB = MongoHelpers.testDB;

// Initialize database for tests
Mongo.init(Mongo.profiles.test);

describe('Mongo', function() {

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