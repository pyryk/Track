describe('Models', function() {

    var Target = Dashboard.Target;

    beforeEach(function(){
        // Mock backend
        spyOn($, 'ajax').andCallFake(function(opts) {
            var response = {};

            if(opts.type === 'GET' && opts.url === '/targets') {
                response = {
                    targets: [
                        {_id: "12faggf", name: "T-Talon ruokajono", relevancy: 9.1251},
                        {_id: "12fa41gf", name: "Baarin meininki", relevancy: 5.23521},
                        {_id: "12fa113f", name: "Mikä fiilis?", relevancy: 1.2427254}
                    ]
                }
            }

            return {
                success: function(successClbk) {
                    successClbk(JSON.stringify(response));
                    return this;
                },
                error: function(errorClbk) {
                    return this;
                }
            }
        })
    });

    it('should fetch targets from backend', function() {
        Target.fetch();

        var targets = Target.all();

        expect(targets[0]._id).toEqual("12faggf");
        expect(targets[1]._id).toEqual("12fa41gf");
        expect(targets[2]._id).toEqual("12fa113f");
    });

})