
var Relevance = function() {
    this.maxScore = 10;
    this.overallPopularityWeight = 1;
};

Relevance.prototype.calculate = function(targets) {

    var maxResults = 0;
    var maxResultsSqrt = 0;

    // Analyze
    targets.forEach(function(target) {
        maxResults = Math.max(target.results ? target.results.length : 0, maxResults);
    });

    maxResultsSqrt = Math.sqrt(maxResults);

    // Calculate and set
    var maxScore = this.maxScore;
    var weight = this.overallPopularityWeight;
    targets.forEach(function(target) {
        if(maxResultsSqrt === 0) {
            target.relevance = 0;
            return;
        }

        target.relevance = Math.sqrt(target.results ? target.results.length : 0) / maxResultsSqrt * maxScore * weight;
    });
}

module.exports = Relevance;