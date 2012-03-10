var http = require('http');
var Promise = require('node-promise').Promise;
var Mongo = require('../mongo');

describe('Integration test', function() {

    var confs = {port: 9999, name: "Track API integration test server"};

    Mongo.init(Mongo.profiles.test);
    require('../server').createServer(confs).start();

    beforeEach(function() {
        Mongo.loadFixtures();
    });

    describe('GET /targets', function() {

        var testRequest = function(opts, callback) {
            var promiseResult;

            var promise = Promise();
            opts = opts || {};
            opts.port = confs.port;
            opts.headers = {
                "Content-Type": "application/json"
            };

            var req = http.request(opts, function(res) {
                var statusCode = res.statusCode;
                var headers = res.headers;
                var body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', function () {
                    body = body !== '' ? JSON.parse(body) : {};

                    promise.resolve({statusCode: statusCode, headers: headers, body: body});
                });
            });

            req.on('error', function(e) {
                console.log('problem with request: ' + e.message);
            });

            if(opts.body) {
                req.write(JSON.stringify(opts.body));
            }

            req.end();

            promise.then(function() {
                promiseResult = arguments;
            });

            waitsFor(function() {
                return promiseResult;
            });

            runs(function() {
                callback.apply(this, promiseResult);
            });
        };

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