var Mongo = require('../modules/mongo');
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
                expect(dbResult.metric.unit).toEqual('1-5');
                expect(dbResult.metric.question).toEqual('Millainen fiilis sinulla on tällä hetkellä?');
            });
        });
    });

    describe('createTarget', function() {
        it('should create a new target with metrics', function() {
            testDB(Mongo.createTarget({
                name: 'Virgin oil mikä meno?',
                metric: {
                    unit: '4-10',
                    question: 'Millanen fiilis Virgin Oilissa on?'
                }
            }), function(id) {
                testDB(Mongo.findTargetById(id), function(dbResult) {
                    expect(dbResult.name).toEqual('Virgin oil mikä meno?');
                    expect(dbResult.metric.unit).toEqual('4-10');
                    expect(dbResult.metric.question).toEqual('Millanen fiilis Virgin Oilissa on?');
                });
            });
        });
    });

    describe('addResult', function() {
        it('should add a new result entry to the tracking target', function() {
            testDB(Mongo.addResult({
                _id: '12345678901234567890abce',
                value: 17
            }), function() {
                testDB(Mongo.findTargetById('12345678901234567890abce'), function(dbResult) {
                    expect(dbResult.results.length).toEqual(17);
                    expect(dbResult.results[16].value).toEqual(17);
                });
            });
        })
    })

});