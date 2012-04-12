
var Relevance = function() {
    this.maxScore = 10;

    var hourly = new HourlyPopularity();
    hourly.weight = 0.5;

    var favorite = new Favorite();
    favorite.weight = 0.5;

    this.strategies = [hourly, favorite];
};

Relevance.prototype.calculate = function(targets, fbUserId) {

    var strategies = this.strategies;
    var maxScore = this.maxScore;

    strategies.forEach(function(strategy) {
        if(strategy.analyzeTargetsStarted) {
            strategy.analyzeTargetsStarted(targets, fbUserId);
        }
    });

    // Analyze
    targets.forEach(function(target) {
        strategies.forEach(function(strategy) {
            if(strategy.analyzeTarget) {
                strategy.analyzeTarget(target, targets, fbUserId);
            }
        });

        var results = target.results || [];

        strategies.forEach(function(strategy) {
            if(strategy.analyzeResultsStarted) {
                strategy.analyzeResultsStarted(results, target, targets, fbUserId);
            }
        });

        results.forEach(function(result) {
            strategies.forEach(function(strategy) {
                if(strategy.analyzeResult) {
                    strategy.analyzeResult(result, results, target, targets, fbUserId);
                }
            });
        });

        strategies.forEach(function(strategy) {
            if(strategy.analyzeResultsFinished) {
                strategy.analyzeResultsFinished(results, target, targets, fbUserId);
            }
        });
    });

    strategies.forEach(function(strategy) {
        if(strategy.analyzeTargetsFinished) {
            strategy.analyzeTargetsFinished(targets);
        }
    });

    strategies.forEach(function(strategy) {
        if(strategy.calculateRelevanciesStarted) {
            strategy.calculateRelevanciesStarted(targets);
        }
    });

    // Calculate and set
    targets.forEach(function(target) {
        var totalRelevance = 0;
        var relevanceFrom = [];
        strategies.forEach(function(strategy) {
            if(strategy.calculateRelevance) {
                var points = strategy.calculateRelevance(target, targets) * maxScore * strategy.weight;
                var result = {};
                result[strategy.name] = points;

                relevanceFrom.push(result);
                totalRelevance += points;
            }
        });

        target.relevance = totalRelevance;
        target.relevanceFrom = relevanceFrom; // DEBUGGING: Relevance from is only for debugging. Not used normally.
    });

    strategies.forEach(function(strategy) {
        if(strategy.calculateRelevanciesFinished) {
            strategy.calculateRelevanciesFinished(targets);
        }
    });
};

var OverallPopularity = function (){
    this.weight = 1;
    this.name = "Overall popularity";
};

OverallPopularity.prototype.analyzeTargetsStarted = function() {
    this.maxResult = 0;
    this.maxResultSqrt = 0;
};

OverallPopularity.prototype.analyzeTargetsFinished = function() {
    this.maxResultSqrt = Math.sqrt(this.maxResult);
};

OverallPopularity.prototype.analyzeTarget = function(target) {
    this.maxResult = Math.max(target.results ? target.results.length : 0, this.maxResult);
};

OverallPopularity.prototype.calculateRelevance = function(target, maxScore) {

    if(this.maxResultSqrt === 0) {
        target.relevance = 0;
        return;
    }

    return Math.sqrt(target.results ? target.results.length : 0) / this.maxResultSqrt;
};

var HourlyPopularity = function() {
    this.weight = 1;
    this.name = "Hourly popularity";
}

HourlyPopularity.prototype.analyzeTargetsStarted = function() {
    this.now = (new Date()).getTime();
    this.oneHourAgo = this.now - (1000 * 60 * 60);
    this.twoHoursAgo = this.now - (1000 * 60 * 60 * 2);
    delete this.minValue;
    delete this.maxValue;
}

HourlyPopularity.prototype.analyzeResultsStarted = function() {
    this.lastHourPopularity = 0;
    this.lastTwoHoursPopularity = 0;
}

HourlyPopularity.prototype.analyzeResult = function(result) {
    var resultTime = result.timestamp.getTime();

    if(resultTime > this.twoHoursAgo) {
        if(resultTime > this.oneHourAgo) {
            this.lastHourPopularity += 1;
        } else {
            this.lastTwoHoursPopularity += 1;
        }
    }
}

HourlyPopularity.prototype.analyzeResultsFinished = function(results, target) {
    target.lastHourPopularity = this.lastHourPopularity;
    target.lastTwoHoursPopularity = this.lastTwoHoursPopularity;

    // Calculate unscaled relevance
    var y1 = target.lastHourPopularity;
    var y2 = target.lastTwoHoursPopularity;

    var slope = y1 - y2;
    var trend = slope * Math.log(1 + (target.results ? target.results.length : 0));

    this.minValue = this.minValue == null ? trend : Math.min(this.minValue, trend);
    this.maxValue = this.maxValue == null ? trend : Math.max(this.maxValue, trend);

    target.unscaledHourlyRelevance = trend;
}

HourlyPopularity.prototype.calculateRelevance = function(target, targets) {
    var delta = this.maxValue - this.minValue;

    if(!delta) {
        return 0;
    }

    return (target.unscaledHourlyRelevance - this.minValue) / delta;
}

var Favorite = function() {
    this.weight = 1;
    this.name = "User's favorite";
};

Favorite.fn = Favorite.prototype;

Favorite.fn.analyzeTargetsStarted = function() {
    this.responseCounts = [];
    this.points = {}; // key: count, value: the point value
};

Favorite.fn.analyzeTarget = function(target) {
    target.userResponded = 0;
};

Favorite.fn.analyzeResult = function(result, results, target, targets, fbUserId) {
    if(result.fbUserId && fbUserId && result.fbUserId === fbUserId) {
        target.userResponded += 1;
    }
};

Favorite.fn.analyzeResultsFinished = function(results, target) {
    if(target.userResponded > 0) {
        this.responseCounts.push(target.userResponded);
    }
};

Favorite.fn.analyzeTargetsFinished = function() {
    var counts = this.responseCounts;
    counts.sort(function(a, b) {
        return a - b;
    });

    var len = counts.length;
    var incr = 1 / len; // Point increase

    for(var i = 0, p = incr; i < len; i++, p += incr) {
        this.points[counts[i]] = p;
    }
};

Favorite.fn.calculateRelevance = function(target) {
    if(target.userResponded === 0) {
        return 0;
    }

    var points = this.points[target.userResponded];

    return points;
};

Relevance.Strategy = {
    OverallPopularity: OverallPopularity,
    HourlyPopularity: HourlyPopularity,
    Favorite: Favorite
}

module.exports = Relevance;