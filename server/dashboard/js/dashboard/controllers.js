(function(global) {
    var App;
    global.App = App = Spine.Controller.sub({
        init: function() {
            Spine.Model.host = "http://82.130.38.67";
            Sidebar.extend({template: Handlebars.compile($("#sidebar-tmpl").html())});
            Title.extend({template: Handlebars.compile($("#title-tmpl").html())});
            Chart.extend({template: Handlebars.compile($("#chart-tmpl").html())});
            Comment.extend({template: Handlebars.compile($("#comment-tmpl").html())});
            Charttext.extend({template: Handlebars.compile($("#charttext-tmpl").html())});
            ResultSum.create({name: 'allResult'});
            new SidebarCustomer({el: $('#sidebar')});
            new BindingQuestion();
            global.Customer.fetch({id: '500cf0a7da8f3be960000096'});
            this.navigate();

        },
        navigate: function() {
            $('.hop').on('click', function() {
                $(this).parent().find('.active').removeClass('active');
                $(this).addClass('active');
                if ($(this).attr('id') == 'grafic-page') {
                    new Chart({el: $('#content')});
                }
                if ($(this).attr('id') == 'comment-page') {
                    new Comment({el: $('#content')});
                }
            });
        }
    });

    var Sidebar;
    global.Sidebar = Sidebar = Spine.Controller.sub({
        events:  {
            "click .questionCheckbox": "clicked"
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
            var url = "http://82.130.38.67/questionresults/" + $(e.target).attr('data-id');
            if ($(e.target).attr('data-id')) global.Question.fetch({url: url});
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

    var BindingQuestion;
    global.BindingQuestion = BindingQuestion =  Spine.Controller.sub({
        init: function() {
            Dashboard.Question.bind("refresh", this.proxy(this.setRelevantQuestions));
            Dashboard.Question.bind("create", this.proxy(this.setRelevantQuestions));
        },
        setRelevantQuestions: function(){
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
            var resultSum = ResultSum.findAllByAttribute("name", "allResult")[0];
            resultSum.setRelevantQuestions(relevantQuestions);
            this.setSerieData();
        },
        setSerieData: function() {
            var resultSum = ResultSum.findAllByAttribute("name", "allResult")[0];
            var seriesData = [ [],[] ];
            var alltimeData = [ [],[] ];

            for (var i in resultSum.relevantQuestions) {

                alltimeData[0][0] = {x: 0, y: 0};
                alltimeData[0][2] = {x: 2, y: 0};
                alltimeData[1][0] = {x: 0, y: 0};
                alltimeData[1][2] = {x: 2, y: 0};

                if (i == 0) {
                    alltimeData[0][1] = {x: 1, y: resultSum.relevantQuestions[i].results.alltime.pos};
                    alltimeData[1][1] = {x: 1, y: resultSum.relevantQuestions[i].results.alltime.neg};

                    for (var j in resultSum.relevantQuestions[i].results.timeDistribution) {
                        seriesData[0][j] = {x: (new Date(resultSum.relevantQuestions[i].results.timeDistribution[j].timestamp)).getTime()/1000,
                            y:resultSum.relevantQuestions[i].results.timeDistribution[j].pos_sum};
                        seriesData[1][j] = {x: (new Date(resultSum.relevantQuestions[i].results.timeDistribution[j].timestamp)).getTime()/1000,
                            y:resultSum.relevantQuestions[i].results.timeDistribution[j].neg_sum};
                    }
                }
                else {
                    alltimeData[0][1] = {x: 1, y: alltimeData[0][2].y + resultSum.relevantQuestions[i].results.alltime.pos};
                    alltimeData[1][1] = {x: 1, y: alltimeData[1][2].y + resultSum.relevantQuestions[i].results.alltime.neg};

                    for (var k in resultSum.relevantQuestions[i].results.timeDistribution) {
                        seriesData[0][k] = {x: (new Date(resultSum.relevantQuestions[i].results.timeDistribution[k].timestamp)).getTime()/1000,
                            y: seriesData[0][k].y + resultSum.relevantQuestions[i].results.timeDistribution[k].pos_sum};
                        seriesData[1][k] = {x: (new Date(resultSum.relevantQuestions[i].results.timeDistribution[k].timestamp)).getTime()/1000,
                            y: seriesData[1][k].y + resultSum.relevantQuestions[i].results.timeDistribution[k].neg_sum};
                    }
                }
            }
            resultSum.setDayTimeResult(seriesData);
            resultSum.setAllTimeResult(alltimeData);
            this.setTitle();
            this.setChart();
        },
        setTitle: function() {
            new Title({el: $('#title')});
        },
        setChart: function() {
            if ($('#grafic-page').attr('class') == 'active hop' || $('#grafic-page').attr('class') == 'hop active') {
                new Chart({el: $('#content')});
            } else {
                new Comment({el: $('#content')});
            }
        }
    });

    var Title;
    global.Title = Title = Spine.Controller.sub({
        init: function() {
            var resultSum = ResultSum.findAllByAttribute("name", "allResult")[0];
            this.setTitle(resultSum);
        },
        setTitle: function(resultSum) {
            var relevantQuestionsString;
            for (var i in resultSum.relevantQuestions) {
                if (i == 0) {
                    relevantQuestionsString = resultSum.relevantQuestions[i].name;
                } else {
                    relevantQuestionsString = "Multiple questions";
                }
            }
            this.html(Title.template(relevantQuestionsString));
        }
    });

    var Charttext;
    global.Charttext = Charttext = Spine.Controller.sub({
        init: function() {
            this.html(Charttext.template());
        }
    });

    var Chart;
    global.Chart = Chart = Spine.Controller.sub({
        init: function() {
            if (!$('#grafic-page').attr('class') == "active hop") return;
            $('#charttext').html('');
            $('#chart1').html('');
            $('#chart2').html('');
            this.html(Chart.template());
            if (!ResultSum.findAllByAttribute("name", "allResult")[0].relevantQuestions) {
                return;
            }
            var graphOne = this.drawGraphDaily(ResultSum.findAllByAttribute("name", "allResult")[0]);
            if (graphOne === "No available data") {
                $('#chart1').html('No available data');
            } else {
                new Charttext({el: $('#charttext')});
                graphOne.render();
            }
            var graphTwo = this.drawGraphAll(ResultSum.findAllByAttribute("name", "allResult")[0]);
            if (graphTwo === "No available data") {
                $('#chart2').html('No available data');
            } else {
                graphTwo.render();
            }
        },

        drawGraphDaily: function(resultSum) {
            var seriesData = resultSum.dayTimeResult;
            var graph;
            if (seriesData[0].length == 0) {
                graph = "No available data";
                return graph;
            }
            graph = new Rickshaw.Graph( {
                element: document.getElementById("chart1"),
                width: 470,
                height: 300,
                renderer: 'bar',
                series: [{color: "#30c020",data: seriesData[0]},
                    {color: "#c05020",data: seriesData[1]}]
            } );
            graph.renderer.unstack = true;
            new Rickshaw.Graph.Axis.Time( { graph: graph } );
            return graph;
        },
        drawGraphAll: function(resultSum) {
            var alltimeData = resultSum.allTimeResult;
            var graph;
            if (alltimeData[0].length == 0) {
                graph = "No available data";
                return graph;
            }
            graph = new Rickshaw.Graph( {
                element: document.getElementById("chart2"),
                width: 340,
                height: 300,
                renderer: 'bar',
                series: [{color: "#30c020",data: alltimeData[0]},
                    {color: "#c05020",data: alltimeData[1]}]
            });
            graph.renderer.unstack = true;
            graph.render();
            return graph;
        }
    });

    var Comment;
    global.Comment = Comment = Spine.Controller.sub({
        init: function() {
            if (!$('#comment-page').attr('class') == "active hop") return;
            $('#charttext').html('');
            $('#chart1').html('');
            $('#chart2').html('');
            if (!ResultSum.findAllByAttribute("name", "allResult")[0].relevantQuestions) return;
            var relevantQuestions = ResultSum.findAllByAttribute("name", "allResult")[0].relevantQuestions;
            var resultList = [];
            var timeList = [];
            for (var i in relevantQuestions) {
                for (var j in relevantQuestions[i].results.timeDistribution) {
                    for (var k in relevantQuestions[i].results.timeDistribution[j].results) {
                        if (relevantQuestions[i].results.timeDistribution[j].results[k].textComment) {
                            resultList.push(relevantQuestions[i].results.timeDistribution[j].results[k].textComment);
                            timeList.push(new Date(relevantQuestions[i].results.timeDistribution[j].timestamp));
                        }

                    }
                }
            }
            this.html(Comment.template({comment: resultList, time: timeList}));
        }
    });


})(Dashboard);