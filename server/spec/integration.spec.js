var Mongo = require('../mongo');
var IntegrationHelpers = require('./helpers').Integration;

// Initialize server for integration tests
var confs = {port: 9999, name: "Track API integration test server"};
require('../server').createServer(confs).start();

// Helper methods for Mongo testing
var testRequest = function(opts, callback) {
    return IntegrationHelpers.testRequest(opts, confs, callback);
}

// Initialize Mongo for integration tests
Mongo.init(Mongo.profiles.test);

describe('Integration test', function() {

    beforeEach(function() {
        Mongo.loadFixtures();
    });

    describe('GET /targets', function() {

        it('GET /targets', function() {
            testRequest({method: 'GET', path: '/targets'}, function(result) {
                expect(result.statusCode).toEqual(200);
                expect(result.body).toEqual({
                    targets: [{
                        name: 'T-Talon ruokajono',
                        _id: '12345678901234567890abce',
                        metric: {
                            unit: 'min',
                            question: 'Kauanko jonotit?'
                        }
                    }, {
                        name: 'Mikä fiilis?',
                        _id: '12345678901234567890abcd',
                        metric: {
                            unit: '1-5',
                            question: 'Millainen fiilis sinulla on tällä hetkellä?'
                        }
                    }, {
                        name: 'Putouksen munamiehen läpän taso',
                        _id: '12345678901234567890abcf',
                        metric: {
                            unit: '4-10',
                            question: 'No millasta läpyskää puskee?'
                        }
                    }]
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
                        }
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
    });
});