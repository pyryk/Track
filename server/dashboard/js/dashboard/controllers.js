(function(global) {
    var App;
    global.App = App = Spine.Controller.sub({
        init: function() {
            Spine.Model.host = "http://82.130.38.67";
            Sidebar.extend({template: Handlebars.compile($("#sidebar-tmpl").html())});
            Title.extend({template: Handlebars.compile($("#title-tmpl").html())});
            Chart.extend({template: Handlebars.compile($("#chart-tmpl").html())});
            ResultSum.create({name: 'allResult'});
            new SidebarCustomer({el: $('#sidebar')});
            new Chart({el: $('#chart')});
            new Title({el: $('#title')});
            global.Customer.fetch({id: '500cf0a7da8f3be960000096'});
        }
    });

    var Sidebar;
    global.Sidebar = Sidebar = Spine.Controller.sub({
        events:  {
            "click .test li": "clicked"
        },
        init: function() {
            if ( !this.item ) throw "customer required";
            this.item.bind("update", this.proxy(this.render));
            this.item.bind("destroy", this.proxy(this.removeEl));
        },
        render: function(item){
            if (item) this.item = item;
            this.html(Sidebar.template(this.item));
            return this;
        },
        removeEl: function() {
            this.el.remove();
        },
        clicked: function(e) {
            var url = "http://82.130.38.67/questionresults/" + $(e.target).find('input:first').attr('data-id');
            global.Question.fetch({url: url});
        }
    });

    var SidebarCustomer;
    global.SidebarCustomer = SidebarCustomer = Spine.Controller.sub({
        init: function(){
           Dashboard.Customer.bind("refresh", this.proxy(this.addAll));
           Dashboard.Customer.bind("create",  this.proxy(this.addOne));
        },
        addOne: function(item){
            if (item) {
                var customer = new Sidebar({item: item});
                this.append(customer.render());
            }
        },
        addAll: function(){
            Customer.each(this.proxy(this.addOne));
        }
    });

    var Title;
    global.Title = Title = Spine.Controller.sub({
        init: function() {
            Dashboard.Question.bind("refresh", this.proxy(this.setTitle));
        },
        setTitle: function() {
            this.html(Title.template(Question.all()[0]));
        }
    });

    var Chart;
    global.Chart = Chart = Spine.Controller.sub({
        init: function() {
            if ( !this.item ) throw "question required";
            this.item.bind("update", this.proxy(this.render));
            this.item.bind("destroy", this.proxy(this.removeEl));
        },
        render: function(item){
            if (item) this.item = item;
            var data = this.setSerieData(item);
            var graph = this.makeGraph(data);
            this.html(Chart.template(graph));
            return this;
        },
        removeEl: function() {
            var data = this.setSerieData();
        },
        setSerieData: function(item) {
            var resultSum = ResultSum.findAllByAttribute("name", "allResult");

            var list = [];
            $("input:checkbox[class=questionCheckbox]:checked").each(function(){
                list.push($(this).val());
            });

            var relevantQuestions = [];
            for (var j = 0; j < Question.all().length; j++) {
                for (var k = 0; k < list.length; k++) {
                    if (Question.all()[j]._id == list[k]){
                        relevantQuestions.push(Question.all()[j]);
                    }
                }
            }
            console.log(relevantQuestions);

            var seriesData = [ [],[] ];
            var alltimeData = [ [],[] ];

            for (var l = 0; l < relevantQuestions.length; l++) {
                var question = relevantQuestions[l].results;
                for (var i = 0; i < question.timeDistribution.length; i++) {
                    seriesData[0].push({x: (new Date(question.timeDistribution[i].timestamp)).getTime()/1000, y:question.timeDistribution[i].pos_sum});
                    seriesData[1].push({x: (new Date(question.timeDistribution[i].timestamp)).getTime()/1000, y:question.timeDistribution[i].neg_sum});
                }
            }
            resultSum.dayTimeResult = seriesData;
            resultSum.allTimeResult = alltimeData;
            resultSum.save();


        }




    });

    var ChartQuestion;
    global.ChartQuestion = ChartQuestion = Spine.Controller.sub({
        init: function() {
            Dashboard.Question.bind("refresh", this.proxy(this.addAll));
            Dashboard.Question.bind("create", this.proxy(this.addOne));
        },
        addOne: function(item){
            if (item) {
                var question = new Chart({item: item});
                this.append(question.render());
            }
        },
        addAll: function(){
            Question.each(this.proxy(this.addOne));
        }
    });




        var Chart;
    global.Chart = Chart = Spine.Controller.sub({
        init: function() {
            Dashboard.Question.bind("refresh", this.proxy(this.getData));
            Spine.bind("show:chart1", this.proxy(this.getData));
        },
        getData: function() {
            this.removeOld();

            var list = [];
            $("input:checkbox[class=questionCheckbox]:checked").each(function(){
                list.push($(this).val());
            });
            var relevantQuestions = [];
            for (var j = 0; j < Question.all().length; j++) {
                for (var k = 0; k < list.length; k++) {
                    if (Question.all()[j]._id == list[k]){
                        relevantQuestions.push(Question.all()[j]);
                    }
                }
            }

            var finalResuts = this.countResults(relevantQuestions);

            var seriesData = [ [],[] ];
            var alltimeData = [ [],[] ];
            for (var l in relevantQuestions) {



                var question = relevantQuestions[l].results;

                for (var i = 0; i < question.timeDistribution.length; i++) {
                    seriesData[0].push({x: (new Date(question.timeDistribution[i].timestamp)).getTime()/1000, y:question.timeDistribution[i].pos_sum});
                    seriesData[1].push({x: (new Date(question.timeDistribution[i].timestamp)).getTime()/1000, y:question.timeDistribution[i].neg_sum});
                }
                alltimeData[0].push({x: 0, y: 0}, {x: 1, y: question.alltime.pos}, {x: 2, y: 0});
                alltimeData[1].push({x: 0, y: 0}, {x: 1, y: question.alltime.neg}, {x: 2, y: 0});
            }

            console.log(seriesData);
            console.log(alltimeData);

            this.drawGraph(seriesData, alltimeData);
        },
        countResults: function(data){
            var questionSum = {
                timeDistribution: [],
                alltime: [],
                comment: []
            }
            for (var i in data) {
                data[i].results.timeDistribution;
            }
        },
        drawGraph: function(seriesData, alltimeData) {
            var graph;
            //document.getElementById("chart1").remove();
            graph = new Rickshaw.Graph( {
                element: document.getElementById("chart1"),
                width: 470,
                height: 300,
                renderer: 'bar',
                series: [{color: "#30c020",data: seriesData[0]},
                    {color: "#c05020",data: seriesData[1]}]
            } );
            graph.renderer.unstack = true;
            graph.render();
            this.drawAxis(graph);

            var graph2;
            graph2 = new Rickshaw.Graph( {
                element: document.getElementById("chart2"),
                width: 470,
                height: 300,
                renderer: 'bar',
                series: [{color: "#30c020",data: alltimeData[0]},
                    {color: "#c05020",data: alltimeData[1]}]
            });
            graph2.renderer.unstack = true;
            graph2.render();
            //this.drawAxis(graph2);
        },
        drawAxis: function(graph) {
            var axes = new Rickshaw.Graph.Axis.Time( { graph: graph } );
            graph.render();
        },
        removeOld: function() {
            //this.el.remove();
            //document.getElementById('chart1').parentNode.removeChild(document.getElementById('chart1'));
        }

    });
})(Dashboard);