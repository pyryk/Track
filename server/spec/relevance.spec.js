var Relevance = require('../modules/relevance.js');

describe('Relevance', function() {
    var rel = new Relevance();

    beforeEach(function() {
        rel.maxScore = 10;
    });

    it('should calculate relevancy by overall popularity', function() {
        Relevance.Strategy.OverallPopularity.weight = 0.5;
        rel.strategies = [Relevance.Strategy.OverallPopularity];

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

    it('should implement Strategy pattern with hook functions', function() {
        // Strategy spy
        var s = {
            analyzeTargetsStarted: jasmine.createSpy(),
            analyzeTargetsFinished: jasmine.createSpy(),
            analyzeTarget: jasmine.createSpy(),

            analyzeResultsStarted: jasmine.createSpy(),
            analyzeResultsFinished: jasmine.createSpy(),
            analyzeResult: jasmine.createSpy(),

            calculateRelevanciesStarted: jasmine.createSpy(),
            calculateRelevanciesFinished: jasmine.createSpy(),
            calculateRelevance: jasmine.createSpy()
        }

        var targets = [
            {results: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]},
            {results: [1, 2, 3, 4, 5, 6, 7, 8, 9]},
            {results: [1, 2, 3, 4]},
            {results: [1]},
            {results: []},
            {}
        ];

        rel.strategies = [s];
        rel.calculate(targets);

        expect(s.analyzeTargetsStarted.callCount).toEqual(1);
        expect(s.analyzeTargetsFinished.callCount).toEqual(1);
        expect(s.analyzeTarget.callCount).toEqual(6);

        expect(s.analyzeResultsStarted.callCount).toEqual(6);
        expect(s.analyzeResultsFinished.callCount).toEqual(6);
        expect(s.analyzeResult.callCount).toEqual(30);

        expect(s.calculateRelevanciesStarted.callCount).toEqual(1);
        expect(s.calculateRelevanciesFinished.callCount).toEqual(1);
        expect(s.calculateRelevance.callCount).toEqual(6);

    });

});
