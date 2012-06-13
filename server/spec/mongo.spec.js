var Mongo = require('../modules/mongo');
var MongoHelpers = require('./helpers').Mongo;
var Query = require('mongoose').Query;
var restify = require('restify');

// Helper methods for Mongo testing
var testDB = MongoHelpers.testDB;

// Initialize database for tests
Mongo.init(Mongo.profiles.test);

describe('Mongo', function() {

    beforeEach(function() {
        var promiseResolved;

        Mongo.loadFixtures().then(function() {
            promiseResolved = true;
        });

        waitsFor(function() {
            return promiseResolved;
        });
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
                expect(dbResult.question).toEqual('Millainen fiilis sinulla on tällä hetkellä?');
            });
        });
    });

    describe('createTarget', function() {
        it('should create a new target', function() {
            testDB(Mongo.createTarget({
                name: 'Virgin oil mikä meno?',
                question: 'Millanen fiilis Virgin Oilissa on?',
                location: {lat: 12.3456, lon: 23.45678},
                fbUserId: '123456'
            }), function(id) {
                testDB(Mongo.findTargetById(id), function(dbResult) {
                    expect(dbResult.name).toEqual('Virgin oil mikä meno?');
                    expect(dbResult.question).toEqual('Millanen fiilis Virgin Oilissa on?');
                    expect(dbResult.createdLocation.lat).toEqual(12.3456);
                    expect(dbResult.creatorFbUserId).toEqual('123456');
                });
            });
        });
    });

    describe('deleteTarget', function() {
        it('should remove the given target object', function() {
            testDB(Mongo.findTargetById('12345678901234567890abcd'), function(target) {
                testDB(Mongo.deleteTarget(target), function() {
                    testDB(Mongo.findTargetById('12345678901234567890abcd'), function(findResult) {
                        expect(findResult).toBe(null);
                    });
                });
            });
        });
    });

    describe('deleteTargetById', function() {
        it('should remove a target specified by the id', function() {
            testDB(Mongo.deleteTargetById('12345678901234567890abcd'), function() {
                testDB(Mongo.findTargetById('12345678901234567890abcd'), function(findResult) {
                   expect(findResult).toBe(null);
                });
            });
        });
    });

    describe('addResult', function() {
        it('should add a new result entry to the tracking target', function() {
            testDB(Mongo.addResult({
                _id: '12345678901234567890abce',
                value: 17,
                fbUserId: '123456',
                location: {lat: 12.3456, lon: 23.45678}
            }), function() {
                testDB(Mongo.findTargetById('12345678901234567890abce'), function(dbResult) {
                    expect(dbResult.results.length).toEqual(17);
                    var result = dbResult.results[16];
                    expect(result.value).toEqual(17);
                    expect(result.fbUserId).toEqual('123456');
                    expect(result.location.lat).toEqual(12.3456);
                    expect(result.location.lon).toEqual(23.45678);
                });
            });
        });

        it('should be possible to add new entry without user', function() {
            testDB(Mongo.addResult({
                _id: '12345678901234567890abce',
                value: 19
            }), function() {
                testDB(Mongo.findTargetById('12345678901234567890abce'), function(dbResult) {
                    expect(dbResult.results.length).toEqual(17);
                    expect(dbResult.results[16].value).toEqual(19);
                });
            });
        });
    });

    describe('countTargetsUserTracked', function() {
        it('should return target count for given user', function() {
            testDB(Mongo.countTargetsUserTracked('123456'), function(count) {
                expect(count).toEqual(1);
            });
        });
    });

    describe('findUserByFBUserId', function() {
        it('should return User by fbUserId', function() {
            testDB(Mongo.findUserByFBUserId('123456'), function(user) {
                expect(user.fbInformation.name).toEqual('Mikko Koski');
            });
        });
    });

    describe('findOrCreateUserByFBUserId', function() {
        it('should return User by fbUserId', function() {
            testDB(Mongo.findOrCreateUserByFBUserId('123456'), function(user) {
                expect(user.fbInformation.name).toEqual('Mikko Koski');
            });
        });

        it('should create a new user and return it', function() {
            testDB(Mongo.findOrCreateUserByFBUserId('999999'), function(user) {
                expect(user.fbUserId).toEqual('999999');
            });
        })
    });

    describe('updateUsersFacebookInformation', function() {
        it('should save given Facebook information', function() {
            testDB(Mongo.updateUsersFacebookInformation('123456', {name: "Mikko Tapio Koski"}), function() {
                testDB(Mongo.findUserByFBUserId('123456'), function(user) {
                    expect(user.fbInformation.name).toEqual('Mikko Tapio Koski')
                })
            });
        });

        it('should be able to create a new user', function() {
            testDB(Mongo.updateUsersFacebookInformation('999999', {name: "Pyry Kröger"}), function() {
                testDB(Mongo.findUserByFBUserId('999999'), function(user) {
                    expect(user.fbInformation.name).toEqual('Pyry Kröger')
                })
            });
        })
    });

    describe('addPoints', function() {
        it('should add given amount of points to the user', function() {
            // Current points: null. Add 5.
            testDB(Mongo.addPoints('123456', 5), function() {
                testDB(Mongo.findUserByFBUserId('123456'), function(user) {
                    expect(user.points).toEqual(5);

                    // Current points: 5. Add 20.
                    testDB(Mongo.addPoints('123456', 20), function() {
                        testDB(Mongo.findUserByFBUserId('123456'), function(user) {
                            expect(user.points).toEqual(25);
                        });
                    });
                })
            });
        });
    });

    describe('findUsersWithMostPoints', function() {
        it('should find 10 users with the most points and sort by points', function() {
            testDB(Mongo.findUsersWithMostPoints(), function(users) {
                expect(users.length).toEqual(10);
                expect(users[0].fbUserId).toEqual('000001');
                expect(users[1].fbUserId).toEqual('000002');
                expect(users[2].fbUserId).toEqual('000003');
                expect(users[3].fbUserId).toEqual('000004');
                expect(users[4].fbUserId).toEqual('000005');
                expect(users[5].fbUserId).toEqual('000006');
                expect(users[6].fbUserId).toEqual('000007');
                expect(users[7].fbUserId).toEqual('000008');
                expect(users[8].fbUserId).toEqual('000009');
                expect(users[9].fbUserId).toEqual('000010');
            });
        });

        it('should not return users without any points', function() {
            // Remove some users first (leave only 000001 and 000002)
            var q = new Query();
            q.nor([{ fbUserId: '000001' }, { fbUserId: '000002' }, { fbUserId: '111111' }, { fbUserId: '123456' }]);

            var removed = false;
            Mongo.User.remove(q, function() {
                removed = true;
            });

            waitsFor(function() {
                return removed;
            });

            var usersFound = false;
            var usersLength = 0;
            runs(function() {
                // Guard assertion: Make sure the remove was successful
                Mongo.User.find({}, function(error, users) {
                    usersLength = users.length;
                    usersFound = true;
                });
            });

            waitsFor(function() {
                return usersFound;
            });

            runs(function() {
                expect(usersLength).toEqual(4);
            });

            // Now, the actual test

            testDB(Mongo.findUsersWithMostPoints(), function(users) {
                expect(users.length).toEqual(2);
                expect(users[0].fbUserId).toEqual('000001');
                expect(users[1].fbUserId).toEqual('000002');
            });

        });
    });
});