
var Relevance = function() {
    this.maxScore = 10;
    this.strategies = [OverallPopularity];
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
                totalRelevance += strategy.calculateRelevance(target, targets) * maxScore;
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

var OverallPopularity = {
    weight: 1,

    analyzeTargetsStarted: function() {
        this.maxResult = 0;
        this.maxResultSqrt = 0;
    },
    analyzeTargetsFinished: function() {
        this.maxResultSqrt = Math.sqrt(this.maxResult);
    },
    analyzeTarget: function(target) {
        this.maxResult = Math.max(target.results ? target.results.length : 0, this.maxResult);
    },

    calculateRelevance: function(target, maxScore) {

        if(this.maxResultSqrt === 0) {
            target.relevance = 0;
            return;
        }

        return Math.sqrt(target.results ? target.results.length : 0) / this.maxResultSqrt * this.weight;
    }
}

Relevance.Strategy = {
    OverallPopularity: OverallPopularity
}

module.exports = Relevance;