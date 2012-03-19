var Mongo = require('../modules/mongo');
var API = require('../modules/api');
var Relevancy = require('../modules/relevancy');
var APIHelpers = require('./helpers').API;

// Helper methods for API testing
var spyOnPromise = APIHelpers.spyOnPromise;
var expectStatus = APIHelpers.expectStatus;
var expectBody = APIHelpers.expectBody;

describe('API', function() {
    var req = {}, res = {}, next;

    var itShouldCallNextWithError = function(apiMethod, mongoMethod) {
        it('should call next with error', function() {
            var error = {message: "An error occured"};
            spyOnPromise(Mongo, mongoMethod).andCallError(error);

            API[apiMethod](req, res, next);

            expect(next).toHaveBeenCalledWith(error);
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

            spyOn(Relevancy, 'calculate').andCallFake(function(targets) {
                var i = 0;
                targets.forEach(function(target) {
                    target.relevancy = i++;
                });
            });


            API.getTargets(req, res, next);

            expectBody(res).toEqual({
                targets: [
                    {name: "T-Talon ruokajono", _id: "accab1234", relevancy: 0},
                    {name: "Putous", _id: "accab12345", relevancy: 1}
                ]
            });
            expectStatus(res).toEqual(200);
        });

        itShouldCallNextWithError('getTargets', 'findAllTargets');
    });

    describe('getTarget', function() {

        it('should return details of a target', function() {
            spyOnPromise(Mongo, 'findTargetById').andCallSuccess(
                {name: "T-Talon ruokajono", _id: "accab1234", metric: {
                    unit: 'min',
                    question: 'Kauanko jonotit?'
                }
                });
            req.params.id = 'accab1234';

            API.getTarget(req, res, next);

            expectBody(res).toEqual({
                target: {name: "T-Talon ruokajono", _id: "accab1234", metric: {
                    unit: 'min',
                    question: 'Kauanko jonotit?'
                }}
            });
            expectStatus(res).toEqual(200);
        });

        itShouldCallNextWithError('getTarget', 'findTargetById');
    });

    describe('postTarget', function() {

        it('should return details of a target', function() {
            spyOnPromise(Mongo, 'createTarget').andCallSuccess('12345678901234567890abce');
            req.params.name = 'New tracking target';
            req.params.metric = {
                unit: 'min',
                question: 'How much time?'
            }

            API.postTarget(req, res, next);

            expect(Mongo.createTarget).toHaveBeenCalledWith({
                name: 'New tracking target',
                metric: {
                    unit: 'min',
                    question: 'How much time?'
                }});
            expectStatus(res).toEqual(201);
            expectBody(res).toEqual({_id: '12345678901234567890abce'});
        });

        itShouldCallNextWithError('postTarget', 'createTarget');
    });

    describe('postResult', function() {
        it('should post result of a tracking', function() {
            spyOnPromise(Mongo, 'addResult').andCallSuccess();
            req.params.id = '12345678901234567890abce';
            req.params.value = 15;

            API.postResult(req, res, next);

            expect(Mongo.addResult).toHaveBeenCalledWith({
                id: '12345678901234567890abce',
                value: 15
            });
            expectStatus(res).toEqual(204);
            expectBody(res).toEqual();
        })
    });

    afterEach(function() {
        expect(next).toHaveBeenCalled();
    });


});