var Relevance = require('../modules/relevance.js');
var DateUtils = require('../modules/now.js');
require('./helpers.js');

describe('Relevance', function() {
    var rel = new Relevance();

    beforeEach(function() {
        rel.maxScore = 10;
    });

    it('should calculate relevancy by overall popularity', function() {
        var overallPopularity = new Relevance.Strategy.OverallPopularity();
        overallPopularity.weight = 0.5;
        rel.strategies = [overallPopularity];

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

    describe('Trending strategy', function() {
        var now = DateUtils.now();
        var minute = 1000 * 60;

        var target1 = createTarget({resultsHourAgo: 10, resultsTwoHoursAgo: 50, resultsTotal: 500});
        var target2 = createTarget({resultsHourAgo: 1, resultsTwoHoursAgo: 50, resultsTotal: 500});
        var target3 = createTarget({resultsHourAgo: 100, resultsTwoHoursAgo: 50, resultsTotal: 500});

        var targets = [target1, target2, target3];

        beforeEach(function() {
            var hourlyPopularity = new Relevance.Strategy.HourlyPopularity();
            hourlyPopularity.weight = 1;
            rel.strategies = [hourlyPopularity];
        });

        function createTarget(opts) {
            var min, max, delta, i, value, time;

            var target = {
                results: []
            };

            function createResults(minutesEarlier, minutesLater, count) {
                // One minute buffer
                min = now - (minutesLater * minute);
                max = now - (minutesEarlier * minute);
                delta = max - min;

                for(i = 0; i < count; i++) {
                    value = Math.random() * 10;
                    time = new Date(min + (Math.random() * delta));

                    target.results.push({value: value, timestamp: time});
                }
            }

            createResults(1, 59, opts.resultsHourAgo);
            createResults(61, 119, opts.resultsTwoHoursAgo);
            createResults(180, 240, (opts.resultsTotal - opts.resultsHourAgo - opts.resultsTwoHoursAgo));

            return target;
        }

        it('should calculate results last one and two hours', function() {

            rel.calculate(targets);

            expect(target1.lastHourPopularity).toEqual(10);
            expect(target1.lastTwoHoursPopularity).toEqual(50);

            expect(target2.lastHourPopularity).toEqual(1);
            expect(target2.lastTwoHoursPopularity).toEqual(50);

            expect(target3.lastHourPopularity).toEqual(100);
            expect(target3.lastTwoHoursPopularity).toEqual(50);
        });

        it('should calculate the relevance based on the hourly trend', function() {

            rel.calculate(targets);

            expect(target1.relevance).toBeGreaterThan(-0.1);
            expect(target1.relevance).toBeLessThan(10.1);

            expect(target2.relevance).toBeGreaterThan(-0.1);
            expect(target2.relevance).toBeLessThan(10.1);

            expect(target3.relevance).toBeGreaterThan(-0.1);
            expect(target3.relevance).toBeLessThan(10.1);

            expect(target3.relevance).toBeGreaterThan(target1.relevance);
            expect(target1.relevance).toBeGreaterThan(target2.relevance);
        })

    });

});
