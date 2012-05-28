var Mongo = require('../modules/mongo');
var API = require('../modules/api');
var APIHelpers = require('./helpers').API;
var CommonHelpers = require('./helpers').Common;

// Helper methods for API testing
var spyOnPromise = CommonHelpers.spyOnPromise;
var waitsForPromise = CommonHelpers.waitsForPromise;
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

    var itShouldCallNextWithRealError = function(apiMethod, mongoMethod) {
        it('should call next with error', function() {
            var error = {message: "An error occured"};
            var errorPromise = spyOnPromise(Mongo, mongoMethod).andCallRealError(error);

            API[apiMethod](req, res, next);

            waitsForPromise(errorPromise);

            runs(function() {
                expect(next).toHaveBeenCalledWith(error);
            });
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

    describe('Static file server', function() {
        it('calls connect without trailing root directory', function() {
            spyOn(API, 'staticFileServer');

            req.url = "dashboard/images/smiley.png";

            API.getPublic(req, res, next);

            expect(API.staticFileServer.mostRecentCall.args[0].url).toEqual('images/smiley.png');
        });
    });

    describe('API methods', function() {

        describe('Run without login', function() {

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
            });


            /*
            describe('deleteTarget', function() {
                it('should delete a target', function() {
                    spyOnPromise(Mongo, 'deleteTargetById').andCallSuccess(
                        {}
                    )

                });
                expectStatus(res).toEqual(204);

            });
            */

            describe('postTarget', function() {

                describe('successfully created', function() {

                    var createTargetPromise, addPointsPromise;

                    beforeEach(function() {
                        createTargetPromise = spyOnPromise(Mongo, 'createTarget').andCallRealSuccess('12345678901234567890abce');
                        addPointsPromise = spyOnPromise(Mongo, 'addPoints').andCallRealSuccess();

                        req.params.name = 'New tracking target';
                        req.params.question = 'How much time?';
                        req.params.location = {lat: 12.3456, lon: 23.4567};
                    })

                    it('should create a new tracking target', function() {
                        req.authorization = {fbUserId: '123456'};

                        API.postTarget(req, res, next);

                        expect(Mongo.createTarget).toHaveBeenCalledWith({
                            name: 'New tracking target',
                            question: 'How much time?',
                            location: {lat: 12.3456, lon: 23.4567},
                            fbUserId: '123456'
                        });

                        expect(Mongo.addPoints).toHaveBeenCalledWith('123456', 5);

                        waitsForPromise(createTargetPromise);
                        waitsForPromise(addPointsPromise);
                    });

                    it('should be able to create a new target without authorization', function() {
                        API.postTarget(req, res, next);

                        expect(Mongo.createTarget).toHaveBeenCalledWith({
                            name: 'New tracking target',
                            question: 'How much time?',
                            location: {lat: 12.3456, lon: 23.4567}
                        });

                        waitsForPromise(createTargetPromise);
                    });

                    afterEach(function() {
                        expectStatus(res).toEqual(201);
                        expectBody(res).toEqual({_id: '12345678901234567890abce'});
                    });

                });
                itShouldCallNextWithRealError('postTarget', 'createTarget');
            });

            describe('postResult', function() {

                describe('success', function() {

                    var addResultPromise, addPointsPromise;

                    beforeEach(function() {
                        addResultPromise = spyOnPromise(Mongo, 'addResult').andCallRealSuccess();
                        addPointsPromise = spyOnPromise(Mongo, 'addPoints').andCallRealSuccess();

                        req.params._id = '12345678901234567890abce';
                        req.params.value = 1;

                        req.params.location = {lat: 12.34567, lon: 23.45678};
                    });

                    it('should post result of a tracking', function() {
                        req.authorization = {fbUserId: '123456'};

                        API.postResult(req, res, next);

                        expect(Mongo.addResult).toHaveBeenCalledWith({
                            _id: '12345678901234567890abce',
                            value: 1,
                            fbUserId: '123456',
                            location: {lat: 12.34567, lon: 23.45678}
                        });

                        expect(Mongo.addPoints).toHaveBeenCalledWith('123456', 1);

                        waitsForPromise(addResultPromise);
                        waitsForPromise(addPointsPromise);
                    });

                    it('should be able to post result without authorization', function() {

                        API.postResult(req, res, next);

                        expect(Mongo.addResult).toHaveBeenCalledWith({
                            _id: '12345678901234567890abce',
                            value: 1,
                            location: {lat: 12.34567, lon: 23.45678}
                        });

                        waitsForPromise(addResultPromise);
                    });

                    afterEach(function() {
                        expectStatus(res).toEqual(204);
                        expectBody(res).toEqual();
                    });

                });

                describe('error', function(){
                    beforeEach(function() {
                        spyOnPromise(Mongo, 'addPoints').andCallRealSuccess();
                    });

                    itShouldCallNextWithRealError('postResult', 'addResult');
                });
            });

            describe('getLeaderboard', function() {
                it('should return the leaderboard', function() {
                    spyOnPromise(Mongo, 'findUsersWithMostPoints').andCallSuccess(
                        [
                            {fbUserId: '000001', fbInformation: {name: 'John Doe'}, points: 102},
                            {fbUserId: '000002', fbInformation: {name: 'Joe Doe'}, points: 100},
                            {fbUserId: '000003', fbInformation: {name: 'Matt Doe'}, points: 99},
                            {fbUserId: '000004', fbInformation: {name: 'John McDonald'}, points: 89},
                            {fbUserId: '000005', fbInformation: {name: 'John Warren'}, points: 78},
                            {fbUserId: '000006', fbInformation: {name: 'Jamie Oliver'}, points: 76},
                            {fbUserId: '000007', fbInformation: {name: 'Matt Duncan'}, points: 71},
                            {fbUserId: '000008', fbInformation: {name: 'Dean Martin'}, points: 66},
                            {fbUserId: '000009', fbInformation: {name: 'James Dean'}, points: 41},
                            {fbUserId: '000010', fbInformation: {name: 'James Bond'}, points: 3}
                        ]
                    );

                    API.getLeaderboard(req, res, next);

                    expectBody(res).toEqual({users: [
                        {fbUserId: '000001', name: 'John Doe', points: 102, picture: "https://graph.facebook.com/000001/picture"},
                        {fbUserId: '000002', name: 'Joe Doe', points: 100, picture: "https://graph.facebook.com/000002/picture"},
                        {fbUserId: '000003', name: 'Matt Doe', points: 99, picture: "https://graph.facebook.com/000003/picture"},
                        {fbUserId: '000004', name: 'John McDonald', points: 89, picture: "https://graph.facebook.com/000004/picture"},
                        {fbUserId: '000005', name: 'John Warren', points: 78, picture: "https://graph.facebook.com/000005/picture"},
                        {fbUserId: '000006', name: 'Jamie Oliver', points: 76, picture: "https://graph.facebook.com/000006/picture"},
                        {fbUserId: '000007', name: 'Matt Duncan', points: 71, picture: "https://graph.facebook.com/000007/picture"},
                        {fbUserId: '000008', name: 'Dean Martin', points: 66, picture: "https://graph.facebook.com/000008/picture"},
                        {fbUserId: '000009', name: 'James Dean', points: 41, picture: "https://graph.facebook.com/000009/picture"},
                        {fbUserId: '000010', name: 'James Bond', points: 3, picture: "https://graph.facebook.com/000010/picture"}
                    ]});
                    expectStatus(res).toEqual(200);
                });
            });
        });

        describe('auth', function() {
            it('should authorize the user and set headers', function() {
                spyOnPromise(API.session, 'isAuthorized').andCallSuccess({fbUserId: '123456', fbAccessToken: 'ABCDEFG', sessionStarted: new Date('2012-03-23T13:39:00.000Z')});

                next.andCallFake(function() {
                    expect(req.authorization).toBeDefined();
                    expect(req.authorization.fbUserId).toEqual('123456');
                });

                API.preAuth(req, res, next);
            })
        });

        describe('getLogin', function() {
            it('should return session and status 200 if logged in', function() {
                req.authorization = {fbUserId: '123456', sessionStarted: new Date('2012-03-23T13:39:00.000Z')};

                API.getLogin(req, res, next);

                expectStatus(res).toEqual(200);
                expectBody(res).toEqual({
                    fbUserId: '123456',
                    sessionStarted: new Date('2012-03-23T13:39:00.000Z')
                });
            });
        });

        afterEach(function() {
            expect(next).toHaveBeenCalled();
        });

    });


});