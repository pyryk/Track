(function(global) {

    global.Target = Target = Spine.Model.sub();
    Target.configure('Target', 'name', 'question', 'results');

    Target.extend(Spine.Model.Ajax);

    Target.extend({
        fromJSON: function(objects) {
            // TODO
            // Change the API according to Spine.Ajax and remove this hackish method
            var targets = (typeof objects === 'string' ? JSON.parse(objects) : objects).targets;
            return Spine.Model.fromJSON.apply(this, [targets]);
        }
    });

})(Dashboard);