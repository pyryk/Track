var Mongo = require('../modules/mongo');
var IntegrationHelpers = require('./helpers').Integration;

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

describe('Integration test', function() {

    beforeEach(function() {
        Mongo.loadFixtures();
    });

    it('GET /targets', function() {
        testRequest({method: 'GET', path: '/targets'}, function(result) {
            expect(result.statusCode).toEqual(200);

            // The order is not guarenteed, thus, sort before assertion
            var sortFunction = function(a, b) {
                if(a._id < b._id) {
                    return -1;
                } else if(a._id === b._id) {
                    return 0;
                } else {
                    return 1;
                }
            }

            // The order is not guarenteed, thus, sort before assertion
            result.body.targets.sort(sortFunction);

            // Expect
            var expectedTargets = [{
                name: 'Mikä fiilis?',
                _id: '12345678901234567890abcd'
            }, {
                name: 'T-Talon ruokajono',
                _id: '12345678901234567890abce'
            }, {
                name: 'Putouksen munamiehen läpän taso',
                _id: '12345678901234567890abcf'
            }].sort(sortFunction);

            // Assertion
            var i = 0;
            result.body.targets.forEach(function(target) {
                var expected = expectedTargets[i]

                expect(target.name).toEqual(expected.name);
                expect(target._id).toEqual(expected._id);
                expect(target.relevancy).toBeGreaterThan(-0.1);
                expect(target.relevancy).toBeLessThan(10.1);

                i += 1;
            });
        });
    });

    it('GET /target/:id', function() {
        testRequest({method: 'GET', path: '/target/12345678901234567890abce'}, function(result) {
            expect(result.statusCode).toEqual(200);
            expect(result.body).toEqual({
                target: {
                    name: 'T-Talon ruokajono',
                    _id: '12345678901234567890abce',
                    metric: {
                        unit: 'min',
                        question: 'Kauanko jonotit?'
                    },
                    results: [10, 5, 6, 7, 20]
                }
            });
        });
    });

    it('POST /target', function() {
        var id;

        runs(function() {
            var body = {
                name: "New track target",
                metric: {
                    unit: "1-5",
                    question: "Mitä mitä?"
                }
            }

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
                expect(result.body.target.metric).toEqual({
                    unit: "1-5",
                    question: "Mitä mitä?"
                });
            });
        });
    });

    it('POST /target/:id/result', function() {
        var id = '12345678901234567890abce';
        var requestComplete;

        runs(function() {
            testRequest({method: 'POST', path: '/target/' + id + '/result', body: {value: 15}}, function(result) {
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
                expect(result.body.target.results.length).toEqual(6);
                expect(result.body.target.results[5].value).toEqual(15);
                expect(isTimestamp(result.body.target.results[5].timestamp)).toBeTruthy();
            });
        });
    });
});