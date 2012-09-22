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
            Dashboard.Question.bind("refresh", this.proxy(this.getData));
        },
        getData: function() {
            var question = Question.all()[0];
            for (var j in question.results.timeDistribution) {

            }
            console.log(question.results.timeDistribution.neg);
            var seriesData = [ [],[] ];
            for (var i = 0; i < question.results.timeDistribution.length; i++) {
                seriesData[0].push({x: i, y: question.results.timeDistribution[i].pos_sum});
                seriesData[1].push({x: i, y: question.results.timeDistribution[i].neg_sum});
            }
            this.drawGraph(seriesData);
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
            graph.renderer.unstack = true;
            graph.render();
            this.drawAxis(graph);
        },
        drawAxis: function(graph) {
            var xAxis = new Rickshaw.Graph.Axis.Time({
                graph: graph
            });

            xAxis.render();
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