var Mongo = require('../mongo');
var API = require('../api');
var APIHelpers = require('./helpers').API;

// Helper methods for API testing
var spyOnPromise = APIHelpers.spyOnPromise;
var expectStatus = APIHelpers.expectStatus;
var expectBody = APIHelpers.expectBody;

describe('API', function() {
    var req = {}, res = {}, next;

    var itShouldCallNextWithError = function(apiMethod, mongoMethod) {
        it(apiMethod + ' should call next with error', function() {
            var error = {message: "An error occured"};
            spyOnPromise(Mongo, mongoMethod).andCallError(error);

            API[apiMethod](req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    };

    var itShouldCallMongo = function(apiMethod, mongoMethod) {
        it(apiMethod + ' should call Mongo.' + mongoMethod + ' and call send()', function() {
            spyOnPromise(Mongo, mongoMethod).andCallSuccess();
            API[apiMethod](req, res, next);
            expect(Mongo[mongoMethod]).toHaveBeenCalled();


            expectStatus(res).toBeGreaterThan(199);
        });
    };

    beforeEach(function() {
        req.params = {};
        res.send = jasmine.createSpy('res.send');
        next = jasmine.createSpy('next');
    });

    describe('getTargets', function() {

        it('should return list of targets', function() {
            spyOnPromise(Mongo, 'findAllTargets').andCallSuccess([
                {name: "T-Talon ruokajono", _id: "accab1234", metric: {}, results: []},
                {name: "Putous", _id: "accab12345", metric: {}, results: []}
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
        itShouldCallMongo('getTarget', 'findTargetById');
        itShouldCallNextWithError('getTarget', 'findTargetById');
    });

    describe('postTarget', function() {
        itShouldCallMongo('postTarget', 'createTarget');
        itShouldCallNextWithError('postTarget', 'createTarget');
    });

    describe('postResult', function() {
        itShouldCallMongo('postResult', 'addResult');
        itShouldCallNextWithError('postResult', 'addResult');
    });

    afterEach(function() {
        expect(next).toHaveBeenCalled();
    });


});