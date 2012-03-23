var http = require('http');
var Promise = require('node-promise').Promise;

var API = {
    spyOnPromise: function(Klass, method) {
        var spy = spyOn(Klass, method);

        return {
            andCallSuccess: function(returnValue) {
                spy.andReturn({
                    then: function(callback) {
                        callback(returnValue);
                    }
                })
            },
            andCallError: function(errorValue) {
                spy.andReturn({
                    then: function(callback, error) {
                        error(errorValue);
                    }
                })
            }
        };
    },

    expectStatus: function(res, status) {
        var args = res.send.mostRecentCall.args;

        if(args.length === 1) {
            // Ok
            return expect(200);
        }
        if(args.length === 2) {
            return expect(args[0]);
        }

        return expect(NaN);
    },

    expectBody: function(res) {
        var args = res.send.mostRecentCall.args;

        if(args.length === 1) {
            // Ok
            return expect(args[0]);
        }
        if(args.length === 2) {
            return expect(args[1]);
        }

        return expect(null);
    }
};

var Mongo = {
    testDB: function(dbPromise, callback) {
        var promiseReturns;

        dbPromise.then(function() {
            promiseReturns = arguments;
        });

        waitsFor(function() {
            return promiseReturns;
        });

        runs(function() {
            callback.apply(this, promiseReturns);
        });
    }
};

var Integration = {

    testRequest: function(opts, confs, callback) {
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
    },

    isTimestamp: function(string) {
        // Valid timestamp 2012-03-10T15:36:38.587Z
        return string.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) !== null
    }
};

module.exports = {
    API: API,
    Mongo: Mongo,
    Integration: Integration
};