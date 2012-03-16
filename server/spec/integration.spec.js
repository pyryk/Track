var Mongo = require('../mongo');
var IntegrationHelpers = require('./helpers').Integration;

// Initialize server for integration tests
var confs = {port: 9999, name: "Track API integration test server"};
require('../server').createServer(confs).start();

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
            result.body.targets.sort(function(a, b) {
                if(a._id < b._id) {
                    return -1;
                } else if(a._id === b._id) {
                    return 0;
                } else {
                    return 1;
                }
            });

            expect(result.body).toEqual({
                targets: [{
                    name: 'Mikä fiilis?',
                    _id: '12345678901234567890abcd'
                }, {
                    name: 'T-Talon ruokajono',
                    _id: '12345678901234567890abce'
                }, {
                    name: 'Putouksen munamiehen läpän taso',
                    _id: '12345678901234567890abcf'
                }]
            });
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
                    results: [0, 0, 0, 1]
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
            testRequest({method: 'POST', path: '/target/' + id + '/result', body: {value: 1}}, function(result) {
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
                expect(result.body.target.results.length).toEqual(5);
                expect(result.body.target.results[4].value).toEqual(1);
                expect(isTimestamp(result.body.target.results[4].timestamp)).toBeTruthy();
            });
        });
    })
});