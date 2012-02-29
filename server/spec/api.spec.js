var Mongo = require('../mongo');
var API = require('../api');

describe('API', function() {
    var req = {}, res = {}, next = {};

    var spyOnPromise = function(Klass, method) {
        return {andReturn: function(returnValue) {
            spyOn(Klass, method).andReturn({
                then: function(callback) {
                    callback(returnValue);
                }
            })
        }};
    };

    var expectStatus = function(res, status) {
        var args = res.send.mostRecentCall.args;

        if(args.length === 1) {
            // Ok
            return expect(200);
        }
        if(args.length === 2) {
            return expect(args[0]);
        }

        return expect(NaN);
    };

    var expectBody = function(body) {
        var args = res.send.mostRecentCall.args;

        if(args.length === 1) {
            // Ok
            return expect(args[0]);
        }
        if(args.length === 2) {
            return expect(args[1]);
        }

        return expect(null);
    };

    beforeEach(function() {

        // Request
        req.params = {};

        // Response
        res.send = jasmine.createSpy();
    });

    describe('getTargets', function() {

        beforeEach(function() {
            spyOnPromise(Mongo, 'findAllTargets').andReturn([
                {name: "T-Talon ruokajono", _id: "accab1234"},
                {name: "Putous", _id: "accab12345"}
            ]);
        });

        it('should return list of targets', function() {
            API.getTargets(req, res, next);

            expectBody(res).toEqual([
                {name: "T-Talon ruokajono", _id: "accab1234"},
                {name: "Putous", _id: "accab12345"}
            ]);

            expectStatus(res).toEqual(200);
        });
    });

    xdescribe('getTarget', function() {

        beforeEach(function() {
            spyOnPromise(Mongo, 'findTargetById').andReturn([
                {name: "T-Talon ruokajono", _id: "accab1234"},
            ]);
        });

        it('should return details of a target', function() {
            req.params.id = 1;

            API.getTarget(req, res, next);

            expectBody(res).toEqual({name: "T-Talon ruokajono", _id: "accab1234"});
            expectStatus(res).toEqual(200);
        })

    })
});