(function(global) {

    global.Question = Question = Spine.Model.sub();
    Question.configure('Question', 'name', 'id', 'results');

    Question.extend(Spine.Model.Ajax);

    Question.extend({
        url: "http://86.50.143.98/questions_dashboard",
        fromJSON: function(objects) {
            // TODO
            // Change the API according to Spine.Ajax and remove this hackish method
            var questions = (typeof objects === 'string' ? JSON.parse(objects) : objects).questions;
            return Spine.Model.fromJSON.apply(this, [questions]);
        }
    });

})(Dashboard);