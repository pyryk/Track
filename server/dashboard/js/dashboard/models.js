(function(global) {

    var ip = "http://86.50.143.102/";

    global.Question = Question = Spine.Model.sub();
    Question.configure('Question', 'name', 'id', 'results');
    Question.extend(Spine.Model.Ajax);
    Question.extend({
        url: ip + "questions_dashboard",
        fromJSON: function(objects) {
            // TODO
            // Change the API according to Spine.Ajax and remove this hackish method
            var questions = (typeof objects === 'string' ? JSON.parse(objects) : objects).questions;
            return Spine.Model.fromJSON.apply(this, [questions]);
        }
    });

    global.Customer = Customer = Spine.Model.sub();
    Customer.configure('Customer', 'name', 'id', 'targets');
    Customer.extend(Spine.Model.Ajax);
    Customer.extend({
        url: ip,
        fromJSON: function(objects) {
            // TODO
            // Change the API according to Spine.Ajax and remove this hackish method
            var customers = (typeof objects === 'string' ? JSON.parse(objects) : objects).customers;
            return Spine.Model.fromJSON.apply(this, [customers]);
        }
    })

})(Dashboard);