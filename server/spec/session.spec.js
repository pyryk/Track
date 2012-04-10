var SessionNamespace = require('../modules/session.js');
var Session = SessionNamespace.Session;
var SessionStore = SessionNamespace.SessionStore;
var FBClient = SessionNamespace.FBClient;
var CommonHelpers = require('./helpers.js').Common;
var _ = require('underscore');
var DateUtils = require('../modules/now.js');

// Helper methods for testing
var promiseReturned = CommonHelpers.promiseReturned;
var spyOnPromise = CommonHelpers.spyOnPromise;

beforeEach(function() {
    this.addMatchers({
        toBeSession: function() {
            var s = this.actual;
            return _.isString(s.fbUserId) && _.isString(s.fbAccessToken) && _.isDate(s.sessionStarted);
        }
    });
});

describe('Session', function() {

    var session, storeMock;

    var fakeSession = {
        fbUserId: '123456',
        fbAccessToken: 'AAAAAA',
        sessionStarted: DateUtils.now()
    };

    beforeEach(function() {
        // Mock session store
        session = new Session();
        storeMock = {
            getValidSession: function() {},
            renewSession: function() {},
            createSession: function() {}
        };
        session.sessionStore = storeMock;
        session.fbClient = new FBClient();
    });

    describe('isAuthorized', function() {

        var authorizedUser = {
            fbUserId: "1111111",
            fbAccessToken: "aaaaaaaaa"
        };

        var authorizedUserWithoutSession = {
            fbUserId: "2222222",
            fbAccessToken: "bbbbbbbbb"
        };



        it('should return true if user has session', function() {
            spyOn(session.sessionStore, 'getValidSession').andReturn(fakeSession);
            spyOn(session.sessionStore, 'renewSession');

            var fbUserId = authorizedUser.fbUserId;
            var fbAccessToken = authorizedUser.fbAccessToken;

            promiseReturned(session.isAuthorized(fbUserId, fbAccessToken)).then(function(result) {
                expect(result).toBeSession();
                expect(session.sessionStore.renewSession).toHaveBeenCalled();
            });
        });

        it('should return false if credentials are not present or invalid', function() {
            promiseReturned(session.isAuthorized('', '')).then(function() {
                expect(false).toBeTruthy(); // Should not come here
            }, function() {
                expect(true).toBeTruthy(); // Should come here
            });
            promiseReturned(session.isAuthorized()).then(function() {
                expect(false).toBeTruthy(); // Should not come here
            }, function() {
                expect(true).toBeTruthy(); // Should come here
            });
        });

        it('should try to create session if no session exists but credentials are ok and return true if session created', function() {
            spyOnPromise(session, 'tryCreateSession').andCallSuccess(fakeSession);

            var fbUserId = authorizedUserWithoutSession.fbUserId;
            var fbAccessToken = authorizedUserWithoutSession.fbAccessToken;

            promiseReturned(session.isAuthorized(fbUserId, fbAccessToken)).then(function(result) {
                expect(result).toBeSession();
            });
        });

        it('should try to create session if no session exists but credentials are ok and return false if session creation failed', function() {
            spyOnPromise(session, 'tryCreateSession').andCallError();

            var fbUserId = authorizedUserWithoutSession.fbUserId;
            var fbAccessToken = authorizedUserWithoutSession.fbAccessToken;

            promiseReturned(session.isAuthorized(fbUserId, fbAccessToken)).then(function() {
                expect(false).toBeTruthy(); // Should not be here
            }, function() {
                expect(true).toBeTruthy(); // Should be here
            });
        });
    });

    describe('tryCreateSession', function() {

        it('should create a new session if me request was successful', function() {
            spyOnPromise(session.fbClient, 'getMe').andCallSuccess();
            spyOn(session.sessionStore, 'createSession').andReturn(fakeSession);

            var promiseResolved = false;
            var promiseReturned;
            var tryCreateSessionPromise = session.tryCreateSession('123456', 'AAAAAA');

            tryCreateSessionPromise.then(function(result) {
                promiseResolved = true;
                promiseReturned = result;
            });

            waitsFor(function() {
                return promiseResolved;
            });

            runs(function() {
                expect(promiseResolved).toBeTruthy();
                expect(session.sessionStore.createSession).toHaveBeenCalledWith('123456', 'AAAAAA');
                expect(promiseReturned).toBeSession();
            });
        });

        it('should reject promise if me request failed', function() {
            spyOnPromise(session.fbClient, 'getMe').andCallError();

            var promiseRejected = false;
            var tryCreateSessionPromise = session.tryCreateSession('123456', 'AAAAAA');

            tryCreateSessionPromise.then(null, function() {
                promiseRejected = true;
            });

            waitsFor(function() {
                return promiseRejected;
            });

            runs(function() {
                expect(promiseRejected).toBeTruthy();
            });
        });
    });
});

describe('SessionStore', function() {
    var sessionStore;
    var session1, session2, session3;

    beforeEach(function() {
        sessionStore = new SessionStore();
        sessionStore.setTimeout(30);

        spyOn(DateUtils, 'now').andReturn(new Date('2012-03-23T13:59:00.000Z'));

        session1 = {fbUserId: '123456', fbAccessToken: 'ABCDEF', sessionStarted: new Date('2012-03-23T13:39:00.000Z')};
        session2 = {fbUserId: '234567', fbAccessToken: 'ABCDEF', sessionStarted: new Date('2012-03-23T13:19:00.000Z')};
        session3 = {fbUserId: '345678', fbAccessToken: 'ABCDEF', sessionStarted: new Date('2012-03-23T13:09:00.000Z')};

        sessionStore.store = [session1, session2, session3];
    });

    describe('getValidSession', function() {

        it('should return session object if session is valid', function() {
            expect(sessionStore.getValidSession('123456', 'ABCDEF')).toBeSession();
        });

        it('should return null and clean up if session is invalid', function() {
            spyOn(sessionStore, 'removeSession');

            expect(sessionStore.getValidSession('234567', 'ABCDEF')).toBeNull();
            expect(sessionStore.removeSession).toHaveBeenCalledWith('234567', 'ABCDEF')
        });

        it('should return null if session does not exists', function() {
            expect(sessionStore.getValidSession('555555', 'ABCDEF')).toBeNull();
        });
    });

    describe('removeSession', function() {

        it('should remove given session', function() {
            sessionStore.removeSession(session1);

            expect(sessionStore.store).toEqual([session2, session3]);
        });
    });

    describe('renewSession', function() {

        it('should renew the given session', function() {
            sessionStore.renewSession(session1);
            expect(sessionStore.getValidSession('123456', 'ABCDEF').sessionStarted).toEqual(DateUtils.now());
        })
    });

    describe('createSession', function() {
        it('should create and return a new session', function() {
            var newSession = sessionStore.createSession('456789', 'ABCDEF');

            expect(newSession).toBeSession();

            newSession = _.last(sessionStore.store);

            expect(newSession.fbUserId).toEqual('456789');
            expect(newSession.fbAccessToken).toEqual('ABCDEF');
            expect(newSession.sessionStarted).toEqual(new Date('2012-03-23T13:59:00.000Z'));
        })
    })
});

/**
 * This is an integration test which should not be run with the normal test set.
 *
 * The reason is that we don't have access token which would be valid always. The access token
 * HAS TO BE CHANGED MANUALLY.
 */
xdescribe('Integration', function() {

    var accessToken = "AAACXZBsWiZB1ABABQiRtKdgIPYdzmETZA2HGOMRAlHpSHWS6kcOlU3JW8b4atAhNWMAUTdZBxiaMrQsgGYnvbRGDdGng1u6yA43jy0AZBsAZDZD"; // CHANGE ME!
    var session;

    beforeEach(function() {
        session = new Session();
        session.fbClient = new FBClient();
        session.sessionStore = new SessionStore();
    })

    it('should authorize user (assuming the access token is valid)', function() {

        spyOn(DateUtils, 'now').andReturn(new Date('2012-03-23T13:59:00.000Z'));

        // First: Should create new session

        spyOn(session, 'tryCreateSession').andCallThrough();

        var promise1Returned = false;
        var promise1Result;

        expect(session.tryCreateSession.callCount).toEqual(0);

        runs(function() {
            session.isAuthorized('123456', accessToken).then(function(result) {
                promise1Result = result;
                promise1Returned = true;
            }, function() {});
        });

        waitsFor(function() {
            return promise1Returned;
        });

        runs(function() {
            expect(session.tryCreateSession.callCount).toEqual(1);
            expect(promise1Result).toBeSession();
        });

        // Second: Should return existing session

        var promise2Returned = false;
        var promise2Result;

        runs(function() {
            session.isAuthorized('123456', accessToken).then(function(result) {
                promise2Result = result;
                promise2Returned = true;
            });
        });

        waitsFor(function() {
            return promise2Returned;
        });

        runs(function() {
            expect(session.tryCreateSession.callCount).toEqual(1);
            expect(promise2Result).toBeSession();
        });

        // Third: Should create new session because the old has timed out

        var promise3Returned = false;
        var promise3Result;

        runs(function() {
            DateUtils.now.andReturn(new Date('2012-03-23T16:59:00.000Z')); // +3 h
            session.isAuthorized('123456', accessToken).then(function(result) {
                promise3Result = result;
                promise3Returned = true;
            });
        });

        waitsFor(function() {
            return promise3Returned;
        });

        runs(function() {
            expect(session.tryCreateSession.callCount).toEqual(2);
            expect(promise3Result).toBeSession();
        });

        // Forth:Completely wrong access token

        var wrongAccessToken = '12345'; // Wrong access token, old session

        var promise4Returned = false;

        runs(function() {
            session.isAuthorized('123456', wrongAccessToken).then(function(result) {

            }, function() {
                promise4Returned = true;
            });
        });

        waitsFor(function() {
            return promise4Returned;
        });

        runs(function() {
            expect(session.tryCreateSession.callCount).toEqual(3);
            expect(promise4Returned).toBeTruthy();
        });
    });

});