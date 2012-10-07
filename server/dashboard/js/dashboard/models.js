(function(global) {


    global.Question = Question = Spine.Model.sub();
    Question.configure('Question', 'name', 'id', 'results');
    Question.extend(Spine.Model.Ajax);
    Question.extend({
        fromJSON: function(objects) {
            // TODO
            // Change the API according to Spine.Ajax and remove this hackish method
            var questions = (typeof objects === 'string' ? JSON.parse(objects) : objects).question;
            return Spine.Model.fromJSON.apply(this, [questions]);
        }
    });

    global.Target = Target = Spine.Model.sub();
    Target.configure('Target', 'name', 'customerId','_id', 'questionsType', 'showQuestionComment', 'customerName', 'questions');
    Target.extend(Spine.Model.Ajax);
    Target.extend({
        //url: "http://192.168.1.9/targets",
        fromJSON: function(objects) {
            // TODO
            // Change the API according to Spine.Ajax and remove this hackish method
            var targets = [];
            var target = (typeof objects === 'string' ? JSON.parse(objects) : objects).target;
            targets.push(target);
            return Spine.Model.fromJSON.apply(this, [targets]);
        }
    });

    global.Customer = Customer = Spine.Model.sub();
    Customer.configure('Customer', 'name', '_id', 'targets');
    Customer.extend(Spine.Model.Ajax);
    Customer.extend({
        //url: "http://192.168.1.9/targets",
        fromJSON: function(objects) {
            // TODO
            // Change the API according to Spine.Ajax and remove this hackish method
            var customers = [];
            var customer = (typeof objects === 'string' ? JSON.parse(objects) : objects).customer;
            customers.push(customer);
            return Spine.Model.fromJSON.apply(this, [customers]);
        }
    });

    global.ResultSum = ResultSum = Spine.Model.sub();
    ResultSum.configure('ResultSum', 'name', 'dayTimeResult', 'allTimeResult', 'relevantQuestions');
    ResultSum.include({
        setDayTimeResult: function(data) {
            this.dayTimeResult = data;
            this.save();
        },
        setAllTimeResult: function(data) {
            this.allTimeResult = data;
            this.save();
        },
        setRelevantQuestions: function(data) {
            this.relevantQuestions = data;
            console.log(this);
            this.save();
        }

    });

})(Dashboard);