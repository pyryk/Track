var Mongo = require('../mongo');

Mongo.init(Mongo.profiles.test);

describe('Mongo', function() {

    beforeEach(function() {
        Mongo.loadFixtures();
    });

    describe('findAllTargets', function() {

        it('should return list of all targets', function() {
            var dbResult;

            runs(function() {
                Mongo.findAllTargets().then(function(data) {
                    dbResult = data;
                });
            });

            waitsFor(function() {
                return dbResult;
            });

            runs(function() {
                expect(dbResult.length).toEqual(3);
            });
        });
    });
});