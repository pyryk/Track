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
                        _id: '12345678901234567890abce'
                    }, {
                        name: 'Mikä fiilis?',
                        _id: '12345678901234567890abcd'
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
                        name: 'T-Talon ruokajono',
                        _id: '12345678901234567890abce'
                    }
                });
            });
        });

        it('POST /target', function() {
            var requestComplete = false;

            runs(function() {
                testRequest({method: 'POST', path: '/target', body: {name: "New track target"}}, function(result) {
                    expect(result.statusCode).toEqual(201);
                    expect(result.body).toEqual({});

                    requestComplete = true;
                });
            });

            waitsFor(function() {
                return requestComplete;
            });

            runs(function() {
                testRequest({method: 'GET', path: '/targets'}, function(result) {
                    expect(result.statusCode).toEqual(200);
                    expect(result.body.targets.length).toEqual(4);
                    expect(result.body.targets.some(function(target) {
                        return target.name === "New track target";
                    })).toBeTruthy();
                });
            });
        });
    });
});