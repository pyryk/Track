var Mongo = require('../modules/mongo');
var IntegrationHelpers = require('./helpers').Integration;
var _ = require('underscore');
var DateUtils = require('../modules/now.js');

// Initialize server for integration tests
var confs = {port: 9999, name: "Track API integration test server"};
require('../modules/server').createServer(confs).start();

// Helper methods for Mongo testing
var testRequest = function(opts, callback) {
    return IntegrationHelpers.testRequest(opts, confs, callback);
};
var isTimestamp = IntegrationHelpers.isTimestamp;

// Initialize Mongo for integration tests
Mongo.init(Mongo.profiles.test);

beforeEach(function() {
    this.addMatchers({

        toMeetRequirements: function(requirements) {
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

                _.forEach(actObj, function(actVal, key) {
                    var reqVal = reqObj[key];

                    if(_.isFunction(reqVal)) {
                        if(!reqVal(actVal)) {
                            this.message = 'Test function failed';
                            passed = false;
                            return;
                        }
                    } else {
                        if(actVal !== reqVal) {
                            this.message = 'Value not equal';
                            passed = false;
                            return;
                        }
                    }
                });
            }

            return passed;
        }

    });
});

describe('Integration test', function() {

    beforeEach(function() {
        Mongo.loadFixtures();
    });

    it('GET /targets', function() {
        testRequest({method: 'GET', path: '/targets'}, function(result) {
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

            expect(result.body.targets).toMeetRequirements(expectedTargets);
        });
    });

    it('GET /target/:id', function() {
        testRequest({method: 'GET', path: '/target/12345678901234567890abce'}, function(result) {
            var target = result.body.target;

            console.log(result.body);

            expect(result.statusCode).toEqual(200);
            expect(target._id).toEqual('12345678901234567890abce');
            expect(target.name).toEqual('T-Talon ruokajono');
            expect(target.question).toEqual('Oliko paljon jonoa?');

            expect(target.results.history).toEqual([
                {start: '2012-03-23T08:00:00.000Z', end: '2012-03-23T08:15:00.000Z', pos: 3, neg: 1},
                {start: '2012-03-23T08:45:00.000Z', end: '2012-03-23T09:00:00.000Z', pos: 0, neg: 2},
                {start: '2012-03-23T10:00:00.000Z', end: '2012-03-23T10:15:00.000Z', pos: 3, neg: 0},
                {start: '2012-03-23T12:00:00.000Z', end: '2012-03-23T12:15:00.000Z', pos: 0, neg: 3},
                {start: '2012-03-23T13:30:00.000Z', end: '2012-03-23T13:45:00.000Z', pos: 2, neg: 0},
                {start: '2012-03-23T13:45:00.000Z', end: '2012-03-23T14:00:00.000Z', pos: 1, neg: 1}
            ]);
        });
    });

    it('GET /target/:id empty result', function() {
        testRequest({method: 'GET', path: '/target/12345678901234567890FFFF'}, function(result) {
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

            testRequest({method: 'POST', path: '/target', body: body}, function(result) {
                expect(result.statusCode).toEqual(201);
                expect(result.body._id.length).toEqual(24); // Valid 24 length string
                id = result.body._id;
            });
        });

        waitsFor(function() {
            return id;
        });

        runs(function() {
            testRequest({method: 'GET', path: '/target/' + id}, function(result) {
                expect(result.statusCode).toEqual(200);
                expect(result.body.target.name).toEqual("New track target");
                expect(result.body.target.question).toEqual("Mitä mitä?");
            });
        });
    });

    it('POST /target/:id/result', function() {
        var id = '12345678901234567890abce';
        var requestComplete;
        spyOn(DateUtils, 'now').andReturn(new Date('2012-03-23T13:59:00.000Z'));

        runs(function() {
            testRequest({method: 'POST', path: '/target/' + id + '/result', body: {value: 0}}, function(result) {
                expect(result.statusCode).toEqual(204);
                expect(result.body).toEqual({});

                requestComplete = true;
            });
        });

        waitsFor(function() {
            return id;
        });

        runs(function() {
            testRequest({method: 'GET', path: '/target/' + id}, function(result) {
                expect(result.statusCode).toEqual(200);
                expect(result.body.target.results.history[5].neg).toEqual(2);
            });
        });
    });
});