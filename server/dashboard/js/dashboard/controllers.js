(function(global) {
    var App;
    global.App = App = Spine.Controller.sub({
        init: function() {
            Spine.Model.host = "http://86.50.145.125/";
            SidebarQuestionItem.extend({template: Handlebars.compile($("#sidebar-tmpl").html())});
            Chart.extend({template: Handlebars.compile($("#chart-tmpl").html())});
            new SidebarQuestions({el: $('#sidebar')});
            global.Question.fetch();
            new Chart({el: $('#chart')});
        }
    });

    var Chart;
    global.Chart = Chart = Spine.Controller.sub({
        init: function() {
            console.log(Question.all());
            Dashboard.Question.bind("refresh", this.proxy(this.addOne));

            //if ( !this.item ) throw "question required";
            //this.item.bind("update", this.proxy(this.render));
            //this.item.bind("destroy", this.proxy(this.removeEl));
        },
        addOne: function() {
            console.log("Chart addOne");
            console.log(Question.all());
            var question = Question.all()[0];
            var seriesData = [ [],[] ];
            for (var i = 0; i < question.results.timeDistribution.length; i++) {
                seriesData[0].push({x: i, y: question.results.timeDistribution[i].pos_sum});
                seriesData[1].push({x: i, y: question.results.timeDistribution[i].neg_sum});
            }


            /*

             seriesData[0].push({x: time, y: pos}); // pos
             seriesData[1].push({x: time, y: neg}); // neg
             */
            console.log(seriesData);

            this.drawGraph(seriesData);

        },
        render: function(item){
            if (item) this.item = item;
            this.html(Chart.template(this.item));
            return this;
        },
        removeEl: function() {
            this.el.remove();
        },
        drawGraph: function(seriesData) {
            var graph;
            graph = new Rickshaw.Graph( {
                element: document.getElementById("chart"),
                width: 470,
                height: 300,
                renderer: 'bar',
                series: [
                    {
                        color: "#c05020",
                        data: seriesData[0]
                    }, {
                        color: "#30c020",
                        data: seriesData[1]
                    }
                ]
            } );
            graph.render();
        }
    });

    var SidebarQuestionItem;
    global.SidebarQuestionItem = SidebarQuestionItem = Spine.Controller.sub({
        init: function() {
            if ( !this.item ) throw "question required";
            this.item.bind("update", this.proxy(this.render));
            this.item.bind("destroy", this.proxy(this.removeEl));
        },
        render: function(item){
            if (item) this.item = item;
            this.html(SidebarQuestionItem.template(this.item));
            return this;
        },
        removeEl: function() {
            this.el.remove();
        }
    });

    var SidebarQuestions;
    global.SidebarQuestions = SidebarQuestions = Spine.Controller.sub({
        init: function(){
            Dashboard.Question.bind("refresh", this.proxy(this.addAll));
            Dashboard.Question.bind("create",  this.proxy(this.addOne));
        },
        addOne: function(item){
            console.log("SidebarQuestions addone");
            var question = new SidebarQuestionItem({item: item});
            this.append(question.render());
        },
        addAll: function(){
            Question.each(this.proxy(this.addOne));
        }
    });
})(Dashboard);