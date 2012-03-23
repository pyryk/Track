var Mongo = require('../modules/mongo');
var IntegrationHelpers = require('./helpers').Integration;
var _ = require('underscore');

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
            expect(result.statusCode).toEqual(200);
            expect(result.body.target._id).toEqual('12345678901234567890abce');
            expect(result.body.target.name).toEqual('T-Talon ruokajono');
            expect(result.body.target.question).toEqual('Oliko paljon jonoa?');
            expect(result.body.target.results).toEqual([
             { value : 1, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 2, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 3, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 4, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 5, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 6, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 7, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 8, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 9, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 10, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 11, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 12, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 13, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 14, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 15, timestamp : '2012-03-23T08:03:48.223Z' },
             { value : 16, timestamp : '2012-03-23T08:03:48.223Z' } ]);
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

        runs(function() {
            testRequest({method: 'POST', path: '/target/' + id + '/result', body: {value: 17}}, function(result) {
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
                expect(result.body.target.results.length).toEqual(17);
                expect(result.body.target.results[16].value).toEqual(17);
                expect(isTimestamp(result.body.target.results[16].timestamp)).toBeTruthy();
            });
        });
    });
});