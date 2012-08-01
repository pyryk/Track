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

    describe('findAllCustomers', function() {

        it('should return list of all customers', function() {
            testDB(Mongo.findCustomers(), function(dbResult) {
                expect(dbResult.length).toEqual(3);
            });
        });
    });

    describe('findCustomerById', function() {
        it('should return details of specific customer by id', function() {
            testDB(Mongo.findCustomerById('12345678901234567890cbcd'), function(dbResult) {
                expect(dbResult.name).toEqual('Aalto-yliopisto');
            });
        });
    });

    describe('findAllTargets', function() {

        it('should return list of all targets', function() {
            testDB(Mongo.findTargets(), function(dbResult) {
                expect(dbResult.length).toEqual(3);
            });
        });
    });

    describe('findTargetById', function() {
        it('should return details of specific target by id', function() {
            testDB(Mongo.findTargetById('12345678901234567890abcd'), function(dbResult) {
                expect(dbResult.name).toEqual('Matematiikka C1');
                expect(dbResult.customerId.toString()).toEqual('12345678901234567890cbcd');
                expect(dbResult.questionType).toEqual('fourSmiles');
                expect(dbResult.showQuestionComment).toEqual(true);
                expect(dbResult.location.lat).toEqual(12.345);
                expect(dbResult.location.lon).toEqual(67.890);
            });
        });
    });

    describe('findAllQuestions', function() {

        it('should return list of all questions', function() {
            testDB(Mongo.findQuestions(), function(dbResult) {
                expect(dbResult.length).toEqual(4);
            });
        });
    });

    describe('findQuestionById', function() {
        it('should return details of specific question by id', function() {
            testDB(Mongo.findQuestionById('12345678901234567890bbcd'), function(dbResult) {
                expect(dbResult.name).toEqual('Opettaako luennoitsija hyvin?');
                expect(dbResult.targetId.toString()).toEqual('12345678901234567890abcd');
            });
        });
    });

    describe('findAllResults', function() {
        it('should return list of all results', function() {
            testDB(Mongo.findResults(), function(dbResult) {
                expect(dbResult.length).toEqual(3);
            });
        });
    });

    describe('findResultById', function() {
        it('should return details of specific result by id', function() {
            testDB(Mongo.findResultById('12345678901234567890dbca'), function(dbResult) {
                expect(dbResult.value).toEqual(1);
                expect(dbResult.fbUserId).toEqual('123456');
                expect(dbResult.timestamp).toEqual(new Date('2012-03-23T08:03:48.223Z'));
                expect(dbResult.questionId.toString()).toEqual('12345678901234567890bbcd');
                expect(dbResult.location.lat).toEqual(12.345);
                expect(dbResult.location.lon).toEqual(67.890);
            });
        });
    });

    describe('createCustomer', function() {
        it('should create a new customer', function() {
            testDB(Mongo.createCustomer({
                name: 'Ravintolafirma A'
            }), function(id) {
                testDB(Mongo.findCustomerById(id), function(dbResult) {
                    expect(dbResult.name).toEqual('Ravintolafirma A');
                });
            });
        });
    });

    describe('createTarget', function() {
        it('should create a new target', function() {
            testDB(Mongo.createTarget({
                name: 'Tuotantotalouden peruskurssi',
                questions: [
                    { name: 'Opettaako luennoitsija hyvin?' },
                    { name: 'Toimivatko kurssin järjestelyt?' },
                    { name: 'Onko kurssi haastava?' },
                    { name: 'Suosittelisitko kurssia kaverille?' }
                ],
                questionType : 'fourSmiles',
                showQuestionComment: false,
                location: {
                    lat: 12.345,
                    lon: 67.890
                },
                customerId: '12345678901234567890cbcd'
            }), function(id) {
                testDB(Mongo.findTargetById(id), function(dbResult) {
                    expect(dbResult.name).toEqual('Tuotantotalouden peruskurssi');
                    expect(dbResult.location.lat).toEqual(12.345);
                    expect(dbResult.location.lon).toEqual(67.890);
                    expect(dbResult.questionType).toEqual('fourSmiles');
                    expect(dbResult.showQuestionComment).toEqual(false);
                    expect(dbResult.customerId.toString()).toEqual('12345678901234567890cbcd');
                });
            });
        });
    });

    describe('createQuestion', function() {
        it('should create a new question', function() {
            testDB(Mongo.createQuestion({
                name: 'Miten menee?'
            }), function(id) {
                testDB(Mongo.findQuestionById(id), function(dbResult) {
                    expect(dbResult.name).toEqual('Miten menee?');
                });
            });
        });
    });

    describe('deleteCustomer', function() {
        it('should remove the given customer object', function() {
            testDB(Mongo.findCustomerById('12345678901234567890cbcd'), function(customer) {
                testDB(Mongo.deleteCustomer(customer), function() {
                    testDB(Mongo.findCustomerById('12345678901234567890cbcd'), function(findResult) {
                        expect(findResult).toBe(null);
                    });
                });
            });
        });
    });

    describe('deleteCustomerById', function() {
        it('should remove a customer specified by the id', function() {
            testDB(Mongo.deleteCustomerById('12345678901234567890cbcd'), function() {
                testDB(Mongo.findCustomerById('12345678901234567890cbcd'), function(findResult) {
                    expect(findResult).toBe(null);
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

    describe('deleteQuestion', function() {
        it('should remove the given question object', function() {
            testDB(Mongo.findQuestionById('12345678901234567890bbcd'), function(question) {
                testDB(Mongo.deleteQuestion(question), function() {
                    testDB(Mongo.findQuestionById('12345678901234567890bbcd'), function(findResult) {
                        expect(findResult).toBe(null);
                    });
                });
            });
        });
    });

    describe('deleteQuestionById', function() {
        it('should remove a question specified by the id', function() {
            testDB(Mongo.deleteQuestionById('12345678901234567890bbcd'), function() {
                testDB(Mongo.findQuestionById('12345678901234567890bbcd'), function(findResult) {
                    expect(findResult).toBe(null);
                });
            });
        });
    });

    describe('addResult', function() {
        it('should add a new result entry to the tracking target', function() {
            testDB(Mongo.addResult({
                questionId: '12345678901234567890bbcd',
                value: 1,
                textComment: 'Hyvä kurssi.',
                fbUserId: '123456',
                location: {lat: 12.3456, lon: 23.45678}
            }), function(id) {
                testDB(Mongo.findResultById(id), function(dbResult) {
                    expect(dbResult.questionId.toString()).toEqual('12345678901234567890bbcd');
                    expect(dbResult.value).toEqual(1);
                    expect(dbResult.textComment).toEqual('Hyvä kurssi.');
                    expect(dbResult.fbUserId).toEqual('123456');
                    expect(dbResult.location.lat).toEqual(12.3456);
                    expect(dbResult.location.lon).toEqual(23.45678);
                });
            });
        });

        it('should be possible to add new entry without user', function() {
            testDB(Mongo.addResult({
                questionId: '12345678901234567890bbcd',
                value: 1,
                textComment: 'Hyvä kurssi.',
                location: {lat: 12.3456, lon: 23.45678}
            }), function(id) {
                testDB(Mongo.findResultById(id), function(dbResult) {
                    expect(dbResult.questionId.toString()).toEqual('12345678901234567890bbcd');
                    expect(dbResult.value).toEqual(1);
                    expect(dbResult.textComment).toEqual('Hyvä kurssi.');
                    expect(dbResult.location.lat).toEqual(12.3456);
                    expect(dbResult.location.lon).toEqual(23.45678);
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