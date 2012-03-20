var Relevance = require('../modules/relevance.js');

describe('Relevance', function() {
    var rel = new Relevance();

    beforeEach(function() {
        rel.maxScore = 10;
        rel.overallPopularityWeight = 0.5;
    });

    it('should calculate relevancy by overall popularity', function() {
        var targets = [
            {results: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]},
            {results: [1, 2, 3, 4, 5, 6, 7, 8, 9]},
            {results: [1, 2, 3, 4]},
            {results: [1]},
            {results: []},
            {}
        ];

        rel.calculate(targets);

        expect(targets[0].relevance).toEqual(5);
        expect(targets[1].relevance).toEqual(3.75);
        expect(targets[2].relevance).toEqual(2.5);
        expect(targets[3].relevance).toEqual(1.25);
        expect(targets[4].relevance).toEqual(0);
        expect(targets[5].relevance).toEqual(0);
    });
});
