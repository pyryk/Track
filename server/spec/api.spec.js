var Mongo = require('../modules/mongo');
var API = require('../modules/api');
var Relevance = require('../modules/relevance');
var APIHelpers = require('./helpers').API;
var CommonHelpers = require('./helpers').Common;

// Helper methods for API testing
var spyOnPromise = CommonHelpers.spyOnPromise;
var expectStatus = APIHelpers.expectStatus;
var expectBody = APIHelpers.expectBody;

var DateUtils = require('../modules/now.js');

describe('API', function() {
    var req, res, next;

    var itShouldCallNextWithError = function(apiMethod, mongoMethod) {
        it('should call next with error', function() {
            var error = {message: "An error occured"};
            spyOnPromise(Mongo, mongoMethod).andCallError(error);

            API[apiMethod](req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    };

    beforeEach(function() {
        req = {};
        req.params = {};
        req.headers = {};
        res = {};
        res.send = jasmine.createSpy('res.send');
        next = jasmine.createSpy('next');
        this.addMatchers({

            toHaveBeenCalledWithError: function(expectedError) {
                var error = this.actual.mostRecentCall.args[0]

                if(error.statusCode !== expectedError.status) {
                    return false;
                }

                if(error.body.code !== expectedError.code) {
                    return false;
                }

                if(error.body.message !== expectedError.message) {
                    return false;
                }

                return true;
            }
        });
    });

    describe('selectFields', function() {
        var obj = {
            name: "Name", size: "Size", address: "Address"
        };

        it('should return only selected fields', function() {
            expect(API.selectFields(obj, ['name', 'size'])).toEqual({name: "Name", size: "Size"});
        });

        it('should ignore fields if they do not exist', function() {
            expect(API.selectFields(obj, ['name', 'size', 'password'])).toEqual({name: "Name", size: "Size"});
        });

        it('should return null for null object', function() {
            expect(API.selectFields(null, ['name', 'size', 'password'])).toBeNull();
        })
    });

    describe('aggregateResults', function() {

        var results = [
            { value : 1, timestamp : new Date('2012-03-23T08:03:48.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T08:02:48.223Z') },
            { value : 0, timestamp : new Date('2012-03-23T08:01:48.223Z') },
            { value : 0, timestamp : new Date('2012-03-23T08:01:18.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:59:48.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:59:11.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:53:48.223Z') },
            // 15 min
            { value : 0, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 0, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 0, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 1, timestamp : new Date('2012-03-23T07:43:48.223Z') },
            { value : 0, timestamp : new Date('2012-03-23T07:43:48.223Z') }];

        beforeEach(function() {
            spyOn(DateUtils, 'now').andReturn(new Date('2012-03-23T08:03:48.223Z'));

            var aggregatedResults = API.aggregateResults(results);
            this.now = aggregatedResults.now;
            this.alltime = aggregatedResults.alltime;
        });

        describe('now and alltime results', function() {

            it('should calculate correct _now_ values from the last 15 minutes', function() {
                expect(this.now.pos).toEqual(5);
                expect(this.now.neg).toEqual(2);
            });

            it('should calculate alltime values', function() {
                expect(this.alltime.pos).toEqual(11);
                expect(this.alltime.neg).toEqual(6);
            });
        });

        describe('trend', function() {

            var resultsNoPastData = [
                { value : 1, timestamp : new Date('2012-03-23T08:03:48.223Z') },
                { value : 1, timestamp : new Date('2012-03-23T08:02:48.223Z') },
                { value : 0, timestamp : new Date('2012-03-23T08:01:48.223Z') },
                { value : 0, timestamp : new Date('2012-03-23T08:01:18.223Z') },
                { value : 1, timestamp : new Date('2012-03-23T07:59:48.223Z') },
                { value : 1, timestamp : new Date('2012-03-23T07:59:11.223Z') },
                { value : 1, timestamp : new Date('2012-03-23T07:53:48.223Z') }];

            it('should calculate trend', function() {
                var currentResult = 5/7; // 71,4%
                var pastResult = 6/10; // 60%

                // Growth is between 10% and 20% -> trend: 2
                expect(this.now.trend).toEqual(2);
            });

            it('should return 0 trend if no past data available', function() {
                var aggregatedResults = API.aggregateResults(resultsNoPastData);

                expect(aggregatedResults.now.trend).toEqual(0);
            });

        });

    });

    describe('API methods', function() {

        describe('Run without login', function() {

            beforeEach(function() {
                spyOnPromise(API, 'authorize').andCallSuccess();
            });

            describe('getTargets', function() {

                it('should return list of targets', function() {
                    spyOnPromise(Mongo, 'findAllTargets').andCallSuccess([
                        {name: "T-Talon ruokajono", _id: "accab1234", question: 'Oliko paljon jonoa?'},
                        {name: "Putous", _id: "accab12345", question: 'Millainen fiilis sinulla on tällä hetkellä?'}
                    ]);

                    spyOn(API.rel, 'calculate').andCallFake(function(targets) {
                        var i = 0;
                        targets.forEach(function(target) {
                            target.relevance = i++;
                        });
                    });

                    API.getTargets(req, res, next);

                    expectBody(res).toEqual({
                        targets: [
                            {name: "Putous", _id: "accab12345", question: 'Millainen fiilis sinulla on tällä hetkellä?', relevance: 1},
                            {name: "T-Talon ruokajono", _id: "accab1234", question: 'Oliko paljon jonoa?', relevance: 0}
                        ]
                    });
                    expectStatus(res).toEqual(200);
                });

                itShouldCallNextWithError('getTargets', 'findAllTargets');
            });

            describe('getTarget', function() {

                it('should return details of a target', function() {
                    spyOnPromise(Mongo, 'findTargetById').andCallSuccess(
                        {name: "T-Talon ruokajono", _id: "accab1234", question: 'Kauanko jonotit?'}
                    );
                    req.params.id = 'accab1234';

                    API.getTarget(req, res, next);

                    expectBody(res).toEqual({
                        target: {name: "T-Talon ruokajono", _id: "accab1234", question: 'Kauanko jonotit?'}
                    });
                    expectStatus(res).toEqual(200);
                });

                itShouldCallNextWithError('getTarget', 'findTargetById');

                it('should return 404 if no results for ID found', function() {
                    spyOnPromise(Mongo, 'findTargetById').andCallSuccess(null);
                    req.params.id = 'accab1234';

                    API.getTarget(req, res, next);

                    expect(next).toHaveBeenCalledWithError({
                        status: 404,
                        code: "ResourceNotFound",
                        message: "Could not find target with ID accab1234"
                    });
                });

                itShouldCallNextWithError('getTarget', 'findTargetById');
            });

            describe('postTarget', function() {

                it('should return details of a target', function() {
                    spyOnPromise(Mongo, 'createTarget').andCallSuccess('12345678901234567890abce');
                    req.params.name = 'New tracking target';
                    req.params.question = 'How much time?';

                    API.postTarget(req, res, next);

                    expect(Mongo.createTarget).toHaveBeenCalledWith({
                        name: 'New tracking target',
                        question: 'How much time?'
                    });
                    expectStatus(res).toEqual(201);
                    expectBody(res).toEqual({_id: '12345678901234567890abce'});
                });

                itShouldCallNextWithError('postTarget', 'createTarget');
            });

            describe('postResult', function() {
                it('should post result of a tracking', function() {

                    spyOnPromise(Mongo, 'addResult').andCallSuccess();
                    req.params.id = '12345678901234567890abce';
                    req.params.value = 1;

                    API.postResult(req, res, next);

                    expect(Mongo.addResult).toHaveBeenCalledWith({
                        id: '12345678901234567890abce',
                        value: 1
                    });
                    expectStatus(res).toEqual(204);
                    expectBody(res).toEqual();
                })
            });
        });

        describe('getLogin', function() {
            it('should return session and status 200 if logged in', function() {
                spyOnPromise(API, 'authorize').andCallSuccess({fbUserId: '123456', fbAccessToken: 'ABCDEFG', sessionStarted: new Date('2012-03-23T13:39:00.000Z')});

                API.getLogin(req, res, next);

                expectStatus(res).toEqual(200);
                expectBody(res).toEqual({
                    fbUserId: '123456',
                    sessionStarted: new Date('2012-03-23T13:39:00.000Z')
                });
            });

            it('should return status 403 if not logged in', function() {
                spyOnPromise(API, 'authorize').andCallError();

                API.getLogin(req, res, next);

                expect(next).toHaveBeenCalledWithError({
                    status: 403,
                    code: "NotAuthorized",
                    message: "Not logged in"
                });
            });
        });

        afterEach(function() {
            expect(next).toHaveBeenCalled();
        });

    });


});