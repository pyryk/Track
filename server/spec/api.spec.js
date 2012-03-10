var Mongo = require('../mongo');
var API = require('../api');

describe('API', function() {
    var req = {}, res = {}, next;

    var spyOnPromise = function(Klass, method) {
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

    var itShouldCallNextWithError = function(apiMethod, mongoMethod) {
        it('should call next with error', function() {
            var error = {message: "An error occured"};
            spyOnPromise(Mongo, mongoMethod).andCallError(error);

            API[apiMethod](req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    };

    beforeEach(function() {

        // Request
        req.params = {};

        // Response
        res.send = jasmine.createSpy('res.send');

        // Next
        next = jasmine.createSpy('next');
    });

    describe('getTargets', function() {

        it('should return list of targets', function() {
            spyOnPromise(Mongo, 'findAllTargets').andCallSuccess([
                {name: "T-Talon ruokajono", _id: "accab1234"},
                {name: "Putous", _id: "accab12345"}
            ]);

            API.getTargets(req, res, next);

            expectBody(res).toEqual({
                targets: [
                    {name: "T-Talon ruokajono", _id: "accab1234"},
                    {name: "Putous", _id: "accab12345"}
                ]
            });
            expectStatus(res).toEqual(200);
        });

        itShouldCallNextWithError('getTargets', 'findAllTargets');
    });

    describe('getTarget', function() {

        it('should return details of a target', function() {
            spyOnPromise(Mongo, 'findTargetById').andCallSuccess(
                {name: "T-Talon ruokajono", _id: "accab1234"}
            );
            req.params.id = 'accab1234';

            API.getTarget(req, res, next);

            expectBody(res).toEqual({
                target: {name: "T-Talon ruokajono", _id: "accab1234"}
            });
            expectStatus(res).toEqual(200);
        });

        itShouldCallNextWithError('getTarget', 'findTargetById');
    });

    describe('postTarget', function() {

        it('should return details of a target', function() {
            spyOnPromise(Mongo, 'createTarget').andCallSuccess();
            req.params.name = 'New tracking target';

            API.postTarget(req, res, next);

            expect(Mongo.createTarget).toHaveBeenCalledWith('New tracking target');
            expectStatus(res).toEqual(201);
        });

        itShouldCallNextWithError('postTarget', 'createTarget');
    });

    afterEach(function() {
        expect(next).toHaveBeenCalled();
    });


});