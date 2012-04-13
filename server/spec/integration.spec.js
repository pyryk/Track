var Mongo = require('../modules/mongo');
var IntegrationHelpers = require('./helpers').Integration;
var CommonHelpers = require('./helpers').Common;
var MongoHelpers = require('./helpers').Mongo;
var _ = require('underscore');
var DateUtils = require('../modules/now.js');
var API = require('../modules/api');

// Initialize server for integration tests
var confs = {port: 9999, name: "Track API integration test server"};
require('../modules/server').createServer(confs).start();

// Helper methods for Mongo testing
var testRequest = function(opts, callback) {
    return IntegrationHelpers.testRequest(opts, confs, callback);
};
var isTimestamp = IntegrationHelpers.isTimestamp;
var spyOnPromise = CommonHelpers.spyOnPromise;
var testDB = MongoHelpers.testDB;

// Initialize Mongo for integration tests
Mongo.init(Mongo.profiles.test);

beforeEach(function() {

    function objectMeetsRequirements(obj, req) {

        if(obj == null && req != null) {
            return {passed: false};
        }

        var passed = {passed: true};

        _.forEach(obj, function(objVal, key) {
            var reqVal = req[key];

            if(_.isFunction(reqVal)) {
                if(!reqVal(objVal)) {
                    passed = {passed: false, key: key, actualValue: objVal, expectedValue: reqVal};
                    return;
                }
            } else {
                if(objVal !== reqVal) {
                    passed = {passed: false, key: key, actualValue: objVal, expectedValue: reqVal};
                    return;
                }
            }
        });

        return passed;
    }

    this.addMatchers({

        toMeetTargetArrayRequirements: function(requirements) {
            var actual = this.actual;

            if(actual.length == null || requirements.length == null) {
                this.message = "Not an array";
                return false;
            }

            var len = actual.length;

            if(len !== requirements.length) {
                this.message = "Not equal length";
                return false;
            }

            var findById = function(_id) {
                return _.find(requirements, function(val) {
                    return val._id === _id;
                })
            }

            var passed = true;
            for(var i = 0; i < len; i++) {
                var actObj = actual[i];
                var reqObj = findById(actObj._id);

                if(!objectMeetsRequirements(actObj, reqObj).passed) {
                    passed = false;
                    break;
                }

            }

            return passed;
        },

        toMeetObjectRequirements: function(requirements) {
            var validationResult = objectMeetsRequirements(this.actual, requirements);
            if(!validationResult.passed) {
                this.message = "Object didn't meet the requirements, key: " + validationResult.key;
                return false;
            }

            return true;
        }

    });
});

describe('Integration test', function() {

    beforeEach(function() {
        Mongo.loadFixtures();
    });

    describe('Do request with authorization', function() {

        var authHeaders;

        beforeEach(function() {

            authHeaders = {'FB-UserId': '123456', 'FB-AccessToken': 'ABCDEFG'};

            spyOn(API.session, 'isAuthorized').andCallFake(function(fbUserId, fbAccessToken) {
                return {
                    then: function(success, error) {
                        if(fbUserId === '123456' && fbAccessToken === 'ABCDEFG') {
                            success({fbUserId: fbUserId, fbAccessToken: fbAccessToken, sessionStarted: DateUtils.now()});
                        } else {
                            error();
                        }
                    }
                }
            });
        });

        it('GET /target/:id', function() {
            request = {method: 'GET', path: '/target/12345678901234567890abce', headers: authHeaders};
            testRequest(request, function(result) {
                var target = result.body.target;

                expect(result.statusCode).toEqual(200);
                expect(target._id).toEqual('12345678901234567890abce');
                expect(target.name).toEqual('T-Talon ruokajono');
                expect(target.question).toEqual('Oliko paljon jonoa?');

                var isValidTrend = function(val) {
                    return _.isNumber(val) && val >= -3 && val <= 3;
                };

                var isPositiveNumber = function(val) {
                    return _.isNumber(val) && val >= 0 && val <= 60;
                };

                var isPositiveNumber = function(val) {
                    return _.isNumber(val) && val >= 0;
                };

                expect(target.results.now).toMeetObjectRequirements({
                    pos: isPositiveNumber,
                    neg: isPositiveNumber,
                    trend: isValidTrend,
                    period: isPositiveNumber
                });

                expect(target.results.alltime).toMeetObjectRequirements({
                    pos: isPositiveNumber,
                    neg: isPositiveNumber
                });
            });
        });

        it('GET /target/:id empty result', function() {
            request = {method: 'GET', path: '/target/12345678901234567890FFFF', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(404);
                expect(result.body).toEqual({code: 'ResourceNotFound', message: 'Could not find target with ID 12345678901234567890FFFF'})
            });
        });

        it('POST /target', function() {
            var id;

            runs(function() {
                var body = {
                    name: "New track target",
                    question: "Mitä mitä?"
                };

                request = {method: 'POST', path: '/target', body: body, headers: authHeaders}
                testRequest(request, function(result) {
                    expect(result.statusCode).toEqual(201);
                    expect(result.body._id.length).toEqual(24); // Valid 24 length string
                    id = result.body._id;
                });
            });

            waitsFor(function() {
                return id;
            });

            runs(function() {
                testRequest({method: 'GET', path: '/target/' + id, headers: authHeaders}, function(result) {
                    expect(result.statusCode).toEqual(200);
                    expect(result.body.target.name).toEqual("New track target");
                    expect(result.body.target.question).toEqual("Mitä mitä?");
                });
            });
        });

        it('POST /target/:id/result', function() {
            var id = '12345678901234567890abce';
            spyOn(DateUtils, 'now').andReturn(new Date('2012-03-23T13:59:00.000Z'));

            // Guard assertion
            runs(function() {
                testRequest({method: 'GET', path: '/target/' + id, headers: authHeaders}, function(result) {
                    expect(result.statusCode).toEqual(200);
                    expect(result.body.target.results.alltime.neg).toEqual(7);

                    requestComplete = true;
                });
            });

            runs(function() {
                request = {method: 'POST', path: '/target/' + id + '/result', body: {value: 0}, headers: authHeaders};
                testRequest(request, function(result) {
                    expect(result.statusCode).toEqual(204);
                    expect(result.body).toEqual({});

                    requestComplete = true;
                });
            });

            runs(function() {
                testRequest({method: 'GET', path: '/target/' + id, headers: authHeaders}, function(result) {
                    expect(result.statusCode).toEqual(200);
                    expect(result.body.target.results.alltime.neg).toEqual(8);
                });
            });

            runs(function() {
                // Should save the user id
                testDB(Mongo.countTargetsUserTracked('123456'), function(count) {
                    expect(count).toEqual(2);
                });
            });
        });
    });

    it('GET /targets', function() {
        request = {method: 'GET', path: '/targets'};
        testRequest(request, function(result) {
            expect(result.statusCode).toEqual(200);

            var testRelevance = function(val) {
                return _.isNumber(val) && val >= 0 && val <= 10;
            }

            // Expect
            var expectedTargets = [{
                name: 'T-Talon ruokajono',
                _id: '12345678901234567890abce',
                question: 'Oliko paljon jonoa?',
                relevance: testRelevance
            }, {
                name: 'Putouksen munamiehen läpän taso',
                _id: '12345678901234567890abcf',
                question: 'No millasta läpyskää puskee?',
                relevance: testRelevance
            }, {
                name: 'Mikä fiilis?',
                _id: '12345678901234567890abcd',
                question: 'Millainen fiilis sinulla on tällä hetkellä?',
                relevance: testRelevance
            }];

            expect(result.body.targets).toMeetTargetArrayRequirements(expectedTargets);
        });
    });

    it('Should have FB-UserID and FB-AccessToken in Access-Control-Allow-Headers', function() {
        // Testing with get targets
        testRequest({method: 'OPTIONS', path: '/targets'}, function(result) {
            expect(result.statusCode).toEqual(200);
            expect(result.headers['access-control-allow-headers']).toMatch('FB-UserId, FB-AccessToken');
        });
    });

    it('GET /login failed', function() {
        testRequest({method: 'GET', path: '/login'}, function(result) {
            expect(result.statusCode).toEqual(403);
        });
    });

    xit('GET /login success', function() {
        // The access token has to be changed if you want this test to pass!
        var accessToken = 'AAACXZBsWiZB1ABAIsUBELlVcjGrdmIZAQXZCqt1EUWSZAJT58tfYXXk6lPi8NlGRfnb0DZCpWi5Jcwg3VcfY5gDcsjYGGOhAgyEio05immzwZDZ'; // CHANGE ME!

        spyOn(DateUtils, 'now').andReturn(new Date('2012-03-23T13:59:00.000Z'));

        testRequest({method: 'GET', path: '/login', headers: {'FB-UserId': '123456', 'FB-AccessToken': accessToken}}, function(result) {
            expect(result.statusCode).toEqual(200);
            expect(result.body.fbUserId).toEqual('123456');
            expect(result.body.sessionStarted).toEqual('2012-03-23T13:59:00.000Z');
        });
    });
});