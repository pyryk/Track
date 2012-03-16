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

            // Expect
            var expectedTargets = [{
                name: 'T-Talon ruokajono',
                _id: '12345678901234567890abce',
                question: 'Oliko paljon jonoa?',
                relevance: 10
            }, {
                name: 'Putouksen munamiehen läpän taso',
                _id: '12345678901234567890abcf',
                question: 'No millasta läpyskää puskee?',
                relevance: 5
            }, {
                name: 'Mikä fiilis?',
                _id: '12345678901234567890abcd',
                question: 'Millainen fiilis sinulla on tällä hetkellä?',
                relevance: 0
            }];

            expect(result.body.targets).toEqual(expectedTargets);
        });
    });

    it('GET /target/:id', function() {
        testRequest({method: 'GET', path: '/target/12345678901234567890abce'}, function(result) {
            expect(result.statusCode).toEqual(200);
            expect(result.body).toEqual({
                target: {
                    _id: '12345678901234567890abce',
                    name: 'T-Talon ruokajono',
                    question: 'Oliko paljon jonoa?',
                    results: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
                }
            });
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