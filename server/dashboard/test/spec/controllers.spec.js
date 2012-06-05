describe('Controllers', function() {

    beforeEach(function() {
        $("#controller-fixtures").empty();
    });

    describe('Targets', function() {
        var Targets;

        beforeEach(function() {
            setFixtures(sandbox()); // Creates 'div#sandbox'

            Targets = new Dashboard.Targets({el: '#sandbox'});

            // Fake templates
            Dashboard.TargetItem.extend({template: Handlebars.compile('<a>{{name}}</a>')});
        });

        afterEach(function() {
            // Clean up
            Dashboard.Target.deleteAll();
        });

        it('should add one item on create', function() {
            Dashboard.Target.create({_id: "12faggf", name: "T-Talon ruokajono"});
            expect($('#sandbox')).toHaveHtml('<li><a>T-Talon ruokajono</a></li>');

        });

        it('should add all items on refresh', function() {
            var response = {
                targets: [
                    {_id: "12fa41gf", name: "Baarin meininki", relevancy: 5.23521},
                    {_id: "12fa113f", name: "Mikä fiilis?", relevancy: 1.2427254}
                ]
            };

            Dashboard.Target.refresh(JSON.stringify(response));

            expect($('#sandbox')).toHaveHtml('<li><a>Baarin meininki</a></li><li><a>Mikä fiilis?</a></li>');
        });
    });
});