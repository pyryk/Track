"use strict";

var Mongo = require('./mongo.js');
var Relevance = require('./relevance');
var _ = require('underscore');
var restify = require('restify');
var connect = require('connect');
var Response = require('restify').Response;
var Session = require('./session').Session;
var FBClient = require('./session').FBClient;
var SessionStore = require('./session').SessionStore;
var p = require("promised-io/promise");
var path = require("path");

var DateUtils = require('../modules/now.js');

var API = {

    rel: new Relevance(),
    session: new Session(),

    start: function(server) {
        this.server = server;
        this.session.sessionStore = new SessionStore;
        this.session.fbClient = new FBClient();

        // Headers
        this.initializeHeaders();

        // Put the handler inside closure to allow mocking
        server.use(function(req, res, next) {
            this.preAuth(req, res, next);
        }.bind(this));

        // Static file server
        this.initializeStaticFileServer();

        // A little tweak to allow optional auth per route
        ['del', 'get', 'head', 'post', 'put'].forEach(function(method) {
            this[method] = function(path, handler, requireAuth) {
                this.server[method](path, function(req, res, next) {
                    this.authorize(req, res, next, handler, requireAuth);
                }.bind(this));
            }
        }.bind(this));


        this.get("/customers", this.getCustomers, false);
        this.get("/customers/:id", this.getCustomerDetails, false);
        this.get("/targets", this.getTargets, false);
        this.get("/targets/:id", this.getTargetDetails, false);
        this.get("/questions/:id/results", this.getResults, false);
        this.get("/questions/:id", this.getQuestionDetails, false);
        this.get("/questionresults/:id", this.getDashboardResults, false);
        this.get("/users/:id", this.getUser, false);

        this.post("/targets", this.postTarget, false);
        this.post("/questions/:id/results", this.postResult, false);
        this.post("/customers", this.postCustomer, false);
        this.post("/questions", this.postQuestion, false);

        this.put("/results/:id", this.addTextComment, false);

        this.del("/targets/:id", this.deleteTarget, false);
        this.del("/questions/:id", this.deleteQuestion, false);
        this.del("/customers/:id", this.deleteCustomer, false);

        this.get("/login", this.getLogin, true);
        this.get("/leaderboard", this.getLeaderboard, false);
        this.get(/\/dashboard\/*/, this.getPublic, false);

    },

    authorize: function(req, res, next, handler, requireAuth) {
        if(requireAuth) {
            if(!req.authorization || !req.authorization.fbUserId) {
                return next(new restify.NotAuthorizedError("Not logged in"));
            }
        }
        handler(req, res, next);
    },

    extendHeaders: function(res) {
        var newAllowedHeaders = 'FB-UserId, FB-AccessToken, X-Requested-With';
        var allowedHeaders = res.headers['access-control-allow-headers'] || "";
        allowedHeaders += (allowedHeaders.length ? ', ' : '') + newAllowedHeaders;

        res.header('Access-Control-Allow-Headers', allowedHeaders);
    },

    initializeHeaders: function() {
        API.defaultHeaders = Response.prototype.defaultHeaders;
        var extendHeaders = this.extendHeaders;
        restify.defaultResponseHeaders = function(data) {
            // 'this' is response object
            var res = this;

            // Run the node-restify default method
            API.defaultHeaders.apply(res, data);

            // Extend with own headers
            extendHeaders(res);
        }
    },

    /**
     * Initializes static file server
     * Uses connect to serve files
     */
    initializeStaticFileServer: function() {
        var root = __dirname + '/../dashboard';
        console.log('Static file server root: ', root);
        API.staticFileServer = connect.static(root);
    },

    preAuth: function(req, res, next) {
        var fbUserId = req.headers['fb-userid'];
        var fbAccessToken = req.headers['fb-accesstoken'];

        API.session.isAuthorized(fbUserId, fbAccessToken).then(function(userSession) {
            var authorization = API.selectFields(userSession, ['fbUserId', 'sessionStarted']);
            req.authorization = authorization;
            return next();
        }, function() {
            return next();
        });
    },

    getPublic: function(req, res, next) {
        req.url = req.url.substr('/dashboard'.length); // take off leading /public so that connect locates it correctly
        return API.staticFileServer(req, res, next);
    },

    getCustomers: function(req, res, next) {
        Mongo.findCustomers().then(function success(data) {
            var selectedFields = ['name', '_id'];
            var customers = data.map(function(customer) {
                return API.selectFields(customer, selectedFields);
            });

            res.send(200, {customers: customers});
            return next();
        }, function(error) {
            return next(error);
        });
    },

    getCustomerDetails: function(req, res, next) {
        var rel = API.rel;
        var customerId = req.params.id;
        var fbUserId = req.authorization ? req.authorization.fbUserId : null;


        Mongo.findCustomerById(customerId).then(function success(data) {
            if(data == null) {
                return next(new restify.ResourceNotFoundError("Could not find customer with ID " + customerId));
            }

            var customerFields = ['name', '_id'];
            var customerDetails = API.selectFields(data, customerFields);

            Mongo.findTargetsWithQuestions('customerId', customerId).then(function(data) {
                rel.calculate(data, fbUserId);

                var targetFields = ['name', '_id', 'relevance', 'questions'];
                var targets = data.map(function(targets) {
                    return API.selectFields(targets, targetFields);
                });

                // Sort
                targets.sort(function(a, b) {
                    var aRel = a.relevance, bRel = b.relevance;
                    if(aRel > bRel) {
                        return -1;
                    } else if(aRel === bRel) {
                        return 0;
                    } else {
                        return 1;
                    }
                });


                customerDetails.targets = targets;

                res.send(200, {customer: customerDetails});
                return next();
            });

        }, function(error) {
            return next(error);
        });
    },

    getTargets: function(req, res, next) {
        req.params.id = "5018dd84e6ce5a6e83000636";
        API.getTargetDetails(req, res, next);
    },

    postCustomer: function(req, res, next) {
        var customer = req.params;
        Mongo.createCustomer(customer).then(function success(createCustomerResult) {
            var id = createCustomerResult;
            res.send(201, {_id: id});
            return next();
        }, function error(err) {
            return next(err);
        });
    },

    deleteCustomer: function(req, res, next) {

        Mongo.deleteCustomerById(req.params.id).then(function success() {
            res.send(204);
            return next();
        }, function error(err) {
            return next(err);
        });

    },

    getTargetDetails: function(req, res, next) {
        var targetId = req.params.id;
        var target;

        Mongo.findTargetById(targetId).then(function success(data) {
            if(data == null) {
                return next(new restify.ResourceNotFoundError("Could not find target with ID " + targetId));
            }

            target = API.selectFields(data, ['name', 'customerId', '_id', 'questionType', 'showQuestionComment']);

            Mongo.findCustomerById(target.customerId).then(function success(data) {
                target.customerName = data.name;

                Mongo.findQuestions('targetId', targetId).then(function success(data) {
                    var questionFields = ['name', '_id'];
                    var questions = data.map(function(questions) {
                        return API.selectFields(questions, questionFields);
                    });

                    target.questions = questions;

                    res.send(200, {target: target});
                    return next();
                });

            });

        }, function(error) {
            return next(error);
        });
    },

    postTarget: function(req, res, next) {
        var target = req.params;
        var questions = req.params.questions;

        Mongo.createTarget(target).then(function success(createTargetResult) {
            // Create questions if present
            if (questions) {
                for (var i in questions) {
                    questions[i].targetId = createTargetResult;
                    Mongo.createQuestion(questions[i]), function(error) {
                        Mongo.resolvePromise(error, id, promise);
                    };
                }
            }

            var id = createTargetResult;
            res.send(201, {_id: id});
            return next();
        }, function error(err) {
            return next(err);
        });

    },

    deleteTarget: function(req, res, next) {

        Mongo.deleteTargetById(req.params.id).then(function success() {
            res.send(204);
            return next();
        }, function error(err) {
            return next(err);
        });

    },

    getQuestionDetails: function(req, res, next) {
        var questionId = req.params.id;

        Mongo.findQuestionById(questionId).then(function success(question) {
            if (!question) {
                return next(new restify.ResourceNotFoundError("Could not find question with ID " + questionId));
            }

            var questionFields = ['_id', 'name', 'targetId'];
            var questionDetails = API.selectFields(question, questionFields);

            Mongo.findTargetById(question.targetId).then(function success(target) {
                questionDetails.targetName = target.name;

                Mongo.findCustomerById(target.customerId).then(function success(customer) {
                    questionDetails.customerName = customer.name;

                    Mongo.findResults('questionId', questionId).then(function success(results) {
                        var aggregatedResults = API.aggregateResults(results);

                        if(aggregatedResults) {
                            results = aggregatedResults;
                        }

                        questionDetails.results = results;
                        res.send(200, {question: questionDetails});
                        return next();
                    });
                });
            });

        }, function(error) {
            return next(error);
        });
    },

    postQuestion: function(req, res, next) {
        var question = req.params;
        Mongo.createQuestion(question).then(function success(createQuestionResult) {
            var id = createQuestionResult;
            res.send(201, {_id: id});
            return next();
        }, function error(err) {
            return next(err);
        });
    },

    deleteQuestion: function(req, res, next) {

        Mongo.deleteQuestionById(req.params.id).then(function success() {
            res.send(204);
            return next();
        }, function error(err) {
            return next(err);
        });

    },

    getResults: function(req, res, next) {
        var debugging = req.headers['debug'] === 'true';
        var questionId = req.params.id;

        Mongo.findQuestionById(questionId).then(function success(data) {
            if(data == null) {
                return next(new restify.ResourceNotFoundError("Could not find question with ID " + questionId));
            }

            var questionFields = ['name', '_id'];
            var questionDetails = API.selectFields(data, questionFields);

            Mongo.findResults('questionId', questionId).then(function success(data) {
                var results = data;

                // Aggregate
                var aggregatedResults = API.aggregateResults(results);


                if(aggregatedResults) {
                    results = aggregatedResults;
                }

                if(debugging) {
                    results.all = results;
                }

                questionDetails.results = results;

                // Add time distribution if dashboard called from getDashboardResults
                if (req.params.dashboard) {
                    var timeDistribution = API.populateTimeSlots(data);
                    questionDetails.results.timeDistribution = timeDistribution;
                }


                res.send(200, {question: questionDetails});
                return next();

            });

        }, function(error) {
            return next(error);
        });

    },

    getDashboardResults: function(req, res, next) {
        req.params.dashboard = true;
        API.getResults(req, res, next);
    },

    postResult: function(req, res, next) {

        if (!req.params.value) {
            return next(new restify.InvalidContentError("Value missing from request."));
        }

        var result = {
            questionId: req.params.id,
            value: req.params.value,
            textComment: req.params.textComment
        };

        var fbUserId = req.authorization ? req.authorization.fbUserId : null;
        var isAuthorized = !!fbUserId;
        var promises = [];

        if(isAuthorized) {
            result.fbUserId = fbUserId;
        }

        var loc = req.params.location
        if(req.params.location) {
            result.location = {lat: loc.lat, lon: loc.lon};
        }

        // Add result
        promises.push(Mongo.addResult(result));
        // Add points
        if(isAuthorized) {
            promises.push(Mongo.addPoints(fbUserId, 1));
        }

        // All ready
        p.all(promises).then(function success(addResultData) {
            var id = addResultData[0]
            res.send(201, {_id: id});
            return next();
        }, function error(error) {
            return next(error);
        });
    },

    addTextComment: function(req, res, next) {
        var updatedFields = ['textComment'];
        var fbUserId = req.authorization ? req.authorization.fbUserId : null;
        var isAuthorized = !!fbUserId;
        var promises = [];

        // Add two points for a comment
        if(isAuthorized) {
            promises.push(Mongo.addPoints(fbUserId, 2));
        }

        promises.push(Mongo.updateResult(req.params, updatedFields));

        p.all(promises).then(function success(data) {
            res.send(204);

        }, function(error) {
            return next(error);
        })

    },

    aggregateResults: function(results) {
        if(!_.isArray(results)) {
            return null;
        }

        // Times
        var now = DateUtils.now();
        var period = 1000 * 60 * 15;
        var nowPeriod = new Date(now.getTime() - period);
        var pastPeriod = new Date(now.getTime() - (2 * period));

        // Results
        var pastResults = {pos: 0, neg: 0}
        var nowResults = {pos: 0, neg: 0, trend: 0, period: 15};
        var alltimeResults = {pos: 0, neg: 0};

        // Iterate and analyze
        results.forEach(function(result) {
            var val = result.value;
            var timestamp = result.timestamp;

            if (val == 44 | val == 43 || val == 22) {
                alltimeResults.pos++;

                // Past
                if (timestamp > pastPeriod && timestamp < nowPeriod) {
                    pastResults.pos++;
                }

                // Now
                if (timestamp > nowPeriod) {
                    nowResults.pos++;
                }
            } else if (val == 42 || val == 41 | val == 21) {
                alltimeResults.neg++;

                // Past
                if (timestamp > pastPeriod && timestamp < nowPeriod) {
                    pastResults.neg++;
                }

                // Now
                if (timestamp > nowPeriod) {
                    nowResults.neg++;
                }
            }

        });

        var pastResultsPercentage = pastResults.pos / (pastResults.pos + pastResults.neg);
        var nowResultsPercentage = nowResults.pos / (nowResults.pos + nowResults.neg);
        var change = nowResultsPercentage - pastResultsPercentage;

        var trend;

        if(change <= -0.2) {
            trend = -3;
        } else if (change <= -0.1) {
            trend = -2;
        } else if (change < 0) {
            trend = -1;
        } else if (change === 0) {
            trend = 0;
        } else if (change < 0.1) {
            trend = 1;
        } else if (change < 0.2) {
            trend = 2;
        } else if (change >= 0.2) {
            trend = 3;
        } else {
            trend = 0;
        }


        nowResults.trend = trend;


        return {alltime: alltimeResults, now: nowResults};
    },


    populateTimeSlots: function(results, slotLength, firstTimestamp, lastTimestamp) {
        if(!_.isArray(results)) {
            console.log("results not array");
            return null;
        }

        if (_.isEmpty(results)) {
            console.log("results empty");
            return [];
        }

        // Setting slot length a day, should be easily parameterized
        var timeSlots = [];
        slotLength = slotLength || 1000 * 60 * 60 * 24; // Default to day

        // Time range comes from results
        firstTimestamp = firstTimestamp || API.arrayFinder(Math.min, results, "timestamp");
        firstTimestamp = Math.floor(firstTimestamp / slotLength) * slotLength;
        lastTimestamp = lastTimestamp || new Date().getTime(); // Default to current date
        lastTimestamp = Math.floor(lastTimestamp / slotLength) * slotLength;

        // Initialize time slots
        while (firstTimestamp <= lastTimestamp) {
            var slot = {timestamp: new Date(firstTimestamp),
                _44: 0, _43: 0, _42: 0, _41: 0, _22: 0, _21: 0,
                pos_sum: 0, neg_sum: 0, sum: 0,
                results: []
            };
            timeSlots.push(slot);
            firstTimestamp += slotLength;
        }

        var currentSlot = 0;

        // Results have to be in ascending order by timestamp for this to work (taken care in mongo.js)
        for (var i = 0; i < results.length; i++) {

            var nextTimestamp = new Date(timeSlots[currentSlot].timestamp.getTime() + slotLength);

            if (results[i].timestamp < nextTimestamp) {

                // Push result record to results array to allow record level access in dashboard
                // in addition to aggregation
                timeSlots[currentSlot].results.push(results[i]);

                if (results[i].value == 41) {
                    timeSlots[currentSlot]._41 += 1;
                    timeSlots[currentSlot].neg_sum += 1;
                    timeSlots[currentSlot].sum += 1;
                } else if (results[i].value == 42) {
                    timeSlots[currentSlot]._42 += 1;
                    timeSlots[currentSlot].neg_sum += 1;
                    timeSlots[currentSlot].sum += 1;
                } else if (results[i].value == 43) {
                    timeSlots[currentSlot]._43 += 1;
                    timeSlots[currentSlot].pos_sum += 1;
                    timeSlots[currentSlot].sum += 1;
                } else if (results[i].value == 44) {
                    timeSlots[currentSlot]._44 += 1;
                    timeSlots[currentSlot].pos_sum += 1;
                    timeSlots[currentSlot].sum += 1;
                } else if(results[i].value == 21) {
                    timeSlots[currentSlot]._21 += 1;
                    timeSlots[currentSlot].neg_sum += 1;
                    timeSlots[currentSlot].sum += 1;
                } else if (results[i].value == 22) {
                    timeSlots[currentSlot]._22 += 1;
                    timeSlots[currentSlot].pos_sum += 1;
                    timeSlots[currentSlot].sum += 1;
                }

            } else {
                // Rewind back to try if i fits the next slot
                i--;

                // Set slots forward
                currentSlot += 1;
            }
        }

        console.log(timeSlots);
        return timeSlots;
    },

    populateTimeSlots2: function(results, slotLength, firstTimestamp, lastTimestamp) {
        if(!_.isArray(results)) {
            return null;
        }

        if (_.isEmpty(results)) {
            console.log("tyhjä");
            return [];
        }

        // Setting slot length a day, should be easily parameterized
        var timeSlots = [];
        slotLength = slotLength || 1000 * 60 * 60 * 24; // Default to day

        // Time range comes from results
        firstTimestamp = firstTimestamp || API.arrayFinder(Math.min, results, "timestamp");
        firstTimestamp = Math.floor(firstTimestamp / slotLength) * slotLength;
        lastTimestamp = lastTimestamp || new Date().getTime(); // Default to current date
        lastTimestamp = Math.floor(lastTimestamp / slotLength) * slotLength;

        // Initialize time slots
        while (firstTimestamp <= lastTimestamp) {
            var slot = {timestamp: new Date(firstTimestamp),
                _44: 0, _43: 0, _42: 0, _41: 0, _22: 0, _21: 0,
                pos_sum: 0, neg_sum: 0, sum: 0,
                results: []
            };
            timeSlots[new Date(firstTimestamp)] = slot;
            console.log(slot);
            firstTimestamp += slotLength;
        }

        var currentSlot = new Date(firstTimestamp);
        var currentTimestamp = new Date(firstTimestamp);

        // Results have to be in ascending order by timestamp for this to work (taken care in mongo.js)
        for (var i = 0; i < results.length; i++) {

            var nextTimestamp = new Date(currentTimestamp + slotLength);

            if (results[i].timestamp < nextTimestamp) {

                // Push result record to results array to allow record level access in dashboard
                // in addition to aggregation
                timeSlots[currentTimestamp].results.push(results[i]);

                if (results[i].value == 41) {
                    timeSlots[currentTimestamp]._41 += 1;
                    timeSlots[currentTimestamp].neg_sum += 1;
                    timeSlots[currentTimestamp].sum += 1;
                } else if (results[i].value == 42) {
                    timeSlots[currentTimestamp]._42 += 1;
                    timeSlots[currentTimestamp].neg_sum += 1;
                    timeSlots[currentTimestamp].sum += 1;
                } else if (results[i].value == 43) {
                    timeSlots[currentTimestamp]._43 += 1;
                    timeSlots[currentTimestamp].pos_sum += 1;
                    timeSlots[currentTimestamp].sum += 1;
                } else if (results[i].value == 44) {
                    timeSlots[currentTimestamp]._44 += 1;
                    timeSlots[currentTimestamp].pos_sum += 1;
                    timeSlots[currentTimestamp].sum += 1;
                } else if(results[i].value == 21) {
                    timeSlots[currentTimestamp]._21 += 1;
                    timeSlots[currentTimestamp].neg_sum += 1;
                    timeSlots[currentTimestamp].sum += 1;
                } else if (results[i].value == 22) {
                    timeSlots[currentTimestamp]._22 += 1;
                    timeSlots[currentTimestamp].pos_sum += 1;
                    timeSlots[currentTimestamp].sum += 1;
                }

            } else {
                // Rewind back to try if i fits the next slot
                i--;

                // Set slots forward
                currentTimestamp = new Date(currentTimestamp.getTime() + slotLength);
            }
        }

        console.log(timeSlots);
        return timeSlots;
    },

    arrayFinder: function(cmp, arr, attr) {
        var val = arr[0][attr];
        for(var i = 1; i < arr.length; i++) {
            val = cmp(val, arr[i][attr])
        }
        return val;
    },


    getLogin: function(req, res, next) {
        var body = req.authorization;

        Mongo.findUserByFBUserId(body.fbUserId).then(function success(data) {
            body.points = data.points;

            res.send(200, body);
            return next();

        }, function(error) {
            return next(error);
        });

    },

    getUser: function(req, res, next) {
        var userId = req.params.id;

        Mongo.findUserByFBUserId(userId).then(function success(data) {
            var selectedFields = ['fbUserId', 'points'];
            var user = API.selectFields(data, selectedFields);

            res.send(200, {user: user});
            return next();
        }, function(error) {
            return next(error);
        });
    },

    getLeaderboard: function(req, res, next) {
        Mongo.findUsersWithMostPoints().then(function success(users) {

            var usersToReturn = [];

            _.each(users, function(user) {
                usersToReturn.push({
                    _id: user._id,
                    fbUserId: user.fbUserId,
                    name: user.fbInformation.name,
                    picture: 'https://graph.facebook.com/' + user.fbUserId + '/picture',
                    points: user.points
                });
            });

            res.send(200, {users: usersToReturn});
            return next();
        }, function error(err) {
            return next(err);
        })
    },

    selectFields: function(obj, fields) {
        if(obj == null) {
            return null;
        }

        var selectedFields = {};

        fields.forEach(function(value) {
            selectedFields[value] = obj[value];
        });

        return selectedFields;
    }
}

module.exports = API;