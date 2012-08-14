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

        it('GET /targets/:id', function() {
            request = {method: 'GET', path: '/targets/12345678901234567890abcd', headers: authHeaders};
            testRequest(request, function(result) {
                var target = result.body.target;

                expect(result.statusCode).toEqual(200);
                expect(target._id).toEqual('12345678901234567890abcd');
                expect(target.customerId).toEqual('12345678901234567890cbcd');
                expect(target.questionType).toEqual('fourSmiles');
                expect(target.showQuestionComment).toEqual(true);
                expect(target.questions[0].name).toEqual('Opettaako luennoitsija hyvin?');
                expect(target.questions[1].name).toEqual('Toimivatko kurssin järjestelyt?');
                expect(target.questions[2].name).toEqual('Onko kurssi haastava?');
                expect(target.questions[3].name).toEqual('Suosittelisitko kurssia kaverille?');
            });


        });

        it('GET /targets/:id empty result', function() {
            request = {method: 'GET', path: '/targets/12345678901234567890FFFF', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(404);
                expect(result.body).toEqual({code: 'ResourceNotFound', message: 'Could not find target with ID 12345678901234567890FFFF'});
            });
        });

        it('GET /customers/:id', function() {
            request = {method: 'GET', path: '/customers/12345678901234567890cbcd', headers: authHeaders};
            testRequest(request, function(result) {
                var customer = result.body.customer;

                expect(result.statusCode).toEqual(200);
                expect(customer._id).toEqual('12345678901234567890cbcd');
                expect(customer.name).toEqual('Aalto-yliopisto');
            });
        });

        it('GET /customers/:id empty result', function() {
            request = {method: 'GET', path: '/customers/12345678901234567890FFFF', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(404);
                expect(result.body).toEqual({code: 'ResourceNotFound', message: 'Could not find customer with ID 12345678901234567890FFFF'});
            });
        });

        it('GET /questions/:id', function() {
            request = {method: 'GET', path: '/questions/12345678901234567890bbcd', headers: authHeaders};
            testRequest(request, function(result) {
                var question = result.body.question;

                expect(result.statusCode).toEqual(200);
                expect(question._id).toEqual('12345678901234567890bbcd');
                expect(question.name).toEqual('Opettaako luennoitsija hyvin?');
                expect(question.targetId).toEqual('12345678901234567890abcd');
                expect(question.targetName).toEqual('Matematiikka C1');
                expect(question.customerName).toEqual('Aalto-yliopisto');
            });
        });

        it('GET /questions/:id empty result', function() {
            request = {method: 'GET', path: '/questions/12345678901234567890FFFF', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(404);
                expect(result.body).toEqual({code: 'ResourceNotFound', message: 'Could not find question with ID 12345678901234567890FFFF'});
            });
        });

        it('GET /questions/:id/results', function() {
            request = {method: 'GET', path: '/questions/12345678901234567890bbcd/results', headers: authHeaders};
            testRequest(request, function(result) {
                var question = result.body.question;

                expect(result.statusCode).toEqual(200);
                expect(question._id).toEqual('12345678901234567890bbcd');
                expect(question.name).toEqual('Opettaako luennoitsija hyvin?');

                var isValidTrend = function(val) {
                    return _.isNumber(val) && val >= -3 && val <= 3;
                };

                var isPositiveNumber = function(val) {
                    return _.isNumber(val) && val >= 0 && val <= 60;
                };

                var isPositiveNumber = function(val) {
                    return _.isNumber(val) && val >= 0;
                };

                expect(question.results.now).toMeetObjectRequirements({
                    pos: isPositiveNumber,
                    neg: isPositiveNumber,
                    trend: isValidTrend,
                    period: isPositiveNumber
                });

                expect(question.results.alltime).toMeetObjectRequirements({
                    pos: isPositiveNumber,
                    neg: isPositiveNumber
                });
            });
        });

        it('GET /questions/:id/results empty result', function() {
            request = {method: 'GET', path: '/questions/12345678901234567890FFFF/results', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(404);
                expect(result.body).toEqual({code: 'ResourceNotFound', message: 'Could not find question with ID 12345678901234567890FFFF'});
            });
        });

        it('DELETE /customers/:id existing id', function() {
            request = {method: 'DELETE', path: '/customers/12345678901234567890cbcd', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(204);
            });
        });

        it('DELETE /customers/:id non-existing id', function() {
            request = {method: 'DELETE', path: '/customers/12345678901234567890FFFF', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(404);
                expect(result.body).toEqual({code: 'ResourceNotFound', message: 'Could not find customer with ID 12345678901234567890FFFF'})
            });
        });

        it('DELETE /targets/:id existing id', function() {
            request = {method: 'DELETE', path: '/targets/12345678901234567890abce', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(204);
            });
        });

        it('DELETE /targets/:id non-existing id', function() {
            request = {method: 'DELETE', path: '/targets/12345678901234567890FFFF', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(404);
                expect(result.body).toEqual({code: 'ResourceNotFound', message: 'Could not find target with ID 12345678901234567890FFFF'})
            });
        });

        it('DELETE /questions/:id existing id', function() {
            request = {method: 'DELETE', path: '/questions/12345678901234567890bbcd', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(204);
            });
        });

        it('DELETE /questions/:id non-existing id', function() {
            request = {method: 'DELETE', path: '/questions/12345678901234567890FFFF', headers: authHeaders};
            testRequest(request, function(result) {
                expect(result.statusCode).toEqual(404);
                expect(result.body).toEqual({code: 'ResourceNotFound', message: 'Could not find question with ID 12345678901234567890FFFF'})
            });
        });


        it('POST /targets', function() {
            var id;

            runs(function() {
                var body = {
                    name: "Track target name",
                    customerId: "12345678901234567890cbcd",
                    questions: [
                        {name: "Viihdyitkö?"},
                        {name: "Maistuiko?"},
                        {name: "Oliko kivaa?"}
                    ],
                    questionType: "fourSmiles",
                    showQuestionComment: true,
                    location: {
                        lat: 12.345,
                        lon: 67.890
                    }
                };

                request = {method: 'POST', path: '/targets', body: body, headers: authHeaders}
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
                testRequest({method: 'GET', path: '/targets/' + id, headers: authHeaders}, function(result) {
                    expect(result.statusCode).toEqual(200);
                    expect(result.body.target.name).toEqual("Track target name");
                    expect(result.body.target.customerId).toEqual("12345678901234567890cbcd");
                    expect(result.body.target.questions[0].name).toEqual("Viihdyitkö?");
                    expect(result.body.target.questions[1].name).toEqual("Maistuiko?");
                    expect(result.body.target.questions[2].name).toEqual("Oliko kivaa?");
                    expect(result.body.target.questionType).toEqual("fourSmiles");
                    expect(result.body.target.showQuestionComment).toEqual(true);
                });

                testDB(Mongo.findTargetById(id), function(target) {
                    expect(target.location.lat).toEqual(12.345);
                    expect(target.location.lon).toEqual(67.890);
                });

            });
        });

        it('POST /questions/:id/results', function() {
            var id = '12345678901234567890bbcd';
            spyOn(DateUtils, 'now').andReturn(new Date('2012-03-23T13:59:00.000Z'));

            var resultId;

            runs(function() {
                var body = {
                    value: 1,
                    location: {
                        lat: 12.3456,
                        lon : 23.4567
                    }
                };

                request = {method: 'POST', path: '/questions/' + id + '/results', body: body, headers: authHeaders};
                testRequest(request, function(result) {
                    expect(result.statusCode).toEqual(201);
                    expect(result.body._id.length).toEqual(24); // Valid 24 length string
                    resultId = result.body._id;

                    requestComplete = true;
                });
            });


            runs(function() {
                testRequest({method: 'GET', path: '/questions/' + id + '/results', headers: authHeaders}, function(result) {
                    expect(result.statusCode).toEqual(200);
                });

                testDB(Mongo.findResultById(resultId), function(result) {
                    expect(result.value).toEqual(1);

                });

                testDB(Mongo.findUserByFBUserId('123456'), function(user) {
                    expect(user.points).toEqual(1);
                });
            });

            runs(function() {
                // Should save the user id
                testDB(Mongo.countTargetsUserTracked('123456'), function(count) {
                    expect(count).toEqual(2);
                });
            });
        });

        it ('POST /customers', function() {
            runs(function() {
                var body = {
                    name: 'Customer A'
                };

                testRequest({method: 'POST', path: '/customers', body: body, headers: authHeaders}, function(result) {
                    expect(result.statusCode).toEqual(201);
                    expect(result.body._id.length).toEqual(24); // Valid 24 length string
                });

            });

        });

        it ('POST /questions', function() {
            runs(function() {
                var body = {
                    name: 'Question A',
                    targetId: '12345678901234567890abcd'
                };

                testRequest({method: 'POST', path: '/questions', body: body, headers: authHeaders}, function(result) {
                    expect(result.statusCode).toEqual(201);
                    expect(result.body._id.length).toEqual(24); // Valid 24 length string
                });

            });

        });


        it('GET /leaderboard', function() {
            testRequest({method: 'GET', path: '/leaderboard'}, function(result) {

                function isId(id) {
                    return _.isString(id) && id.length === 24;
                }

                expect(result.statusCode).toEqual(200);
                expect(result.body.users).toEqual([
                    {_id: '111111111111111111111111', fbUserId: '000001', name: 'John Doe', points: 102, picture: "https://graph.facebook.com/000001/picture"},
                    {_id: '111111111111111111111112', fbUserId: '000002', name: 'Joe Doe', points: 100, picture: "https://graph.facebook.com/000002/picture"},
                    {_id: '111111111111111111111113', fbUserId: '000003', name: 'Matt Doe', points: 99, picture: "https://graph.facebook.com/000003/picture"},
                    {_id: '111111111111111111111114', fbUserId: '000004', name: 'John McDonald', points: 89, picture: "https://graph.facebook.com/000004/picture"},
                    {_id: '111111111111111111111115', fbUserId: '000005', name: 'John Warren', points: 78, picture: "https://graph.facebook.com/000005/picture"},
                    {_id: '111111111111111111111116', fbUserId: '000006', name: 'Jamie Oliver', points: 76, picture: "https://graph.facebook.com/000006/picture"},
                    {_id: '111111111111111111111117', fbUserId: '000007', name: 'Matt Duncan', points: 71, picture: "https://graph.facebook.com/000007/picture"},
                    {_id: '111111111111111111111118', fbUserId: '000008', name: 'Dean Martin', points: 66, picture: "https://graph.facebook.com/000008/picture"},
                    {_id: '111111111111111111111119', fbUserId: '000009', name: 'James Dean', points: 41, picture: "https://graph.facebook.com/000009/picture"},
                    {_id: '111111111111111111111120', fbUserId: '000010', name: 'James Bond', points: 3, picture: "https://graph.facebook.com/000010/picture"}
                ]);
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

    it('GET /dashboard/index.html', function() {
        testRequest({method: 'GET', path: '/dashboard/index.html', headers: {"Content-Type": "text/html"}}, function(result) {
            expect(result.statusCode).toEqual(200);
            expect(result.body).toMatch("<title>Track Dashboard</title>");
        });
    })

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