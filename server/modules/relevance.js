
var Relevance = function() {
    this.maxScore = 10;
    this.strategies = [new HourlyPopularity()];
};

Relevance.prototype.calculate = function(targets) {

    var strategies = this.strategies;
    var maxScore = this.maxScore;

    strategies.forEach(function(strategy) {
        if(strategy.analyzeTargetsStarted) {
            strategy.analyzeTargetsStarted(targets);
        }
    });

    // Analyze
    targets.forEach(function(target) {
        strategies.forEach(function(strategy) {
            if(strategy.analyzeTarget) {
                strategy.analyzeTarget(target, targets);
            }
        });

        var results = target.results || [];

        strategies.forEach(function(strategy) {
            if(strategy.analyzeResultsStarted) {
                strategy.analyzeResultsStarted(results, target, targets);
            }
        });

        results.forEach(function(result) {
            strategies.forEach(function(strategy) {
                if(strategy.analyzeResult) {
                    strategy.analyzeResult(result, results, target, targets);
                }
            });
        });

        strategies.forEach(function(strategy) {
            if(strategy.analyzeResultsFinished) {
                strategy.analyzeResultsFinished(results, target, targets);
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
        strategies.forEach(function(strategy) {
            if(strategy.calculateRelevance) {
                totalRelevance += strategy.calculateRelevance(target, targets) * maxScore * strategy.weight;
            }
        });

        target.relevance = totalRelevance;
    });

    strategies.forEach(function(strategy) {
        if(strategy.calculateRelevanciesFinished) {
            strategy.calculateRelevanciesFinished(targets);
        }
    });
};

var OverallPopularity = function (){
    this.weight = 1;
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

Relevance.Strategy = {
    OverallPopularity: OverallPopularity,
    HourlyPopularity: HourlyPopularity
}

module.exports = Relevance;