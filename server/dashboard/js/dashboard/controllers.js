(function(global) {
    var App;
    global.App = App = Spine.Controller.sub({
        init: function() {
            Spine.Model.host = "http://192.168.1.9";
            //setting templates
            Sidebar.extend({template: Handlebars.compile($("#sidebar-tmpl").html())});
            Title.extend({template: Handlebars.compile($("#title-tmpl").html())});

            new SidebarTarget({el: $('#sidebar')});
            //new SidebarQuestions({el: $('#sidebar')});
            //new Chart({el: $('#chart')});
            //new Title({el: $('#title')});
            //global.Question.fetch();
            global.Target.fetch();
        }
    });

    var Title;
    global.Title = Title = Spine.Controller.sub({
        init: function() {
            Dashboard.Question.bind("refresh", this.proxy(this.setTitle));
            console.log(global.url);

        },
        setTitle: function() {
            this.html(Title.template(Question.all()[0]));
        }
    });

    var Chart;
    global.Chart = Chart = Spine.Controller.sub({
        init: function() {
            Dashboard.Question.bind("refresh", this.proxy(this.getData));
            console.log("Chart-init");
        },
        getData: function() {
            console.log("getData");
            var question = Question.all()[0];
            var seriesData = [ [],[] ];
            var alltimeData = [ [],[] ];
            for (var i = 0; i < question.results.timeDistribution.length; i++) {
                var date = (new Date(question.results.timeDistribution[i].timestamp)).getTime()/1000;
                seriesData[0].push({x: date, y: question.results.timeDistribution[i].pos_sum});
                seriesData[1].push({x: date, y: question.results.timeDistribution[i].neg_sum});
            }
            alltimeData[0].push({x: 0, y: 0});
            alltimeData[1].push({x: 0, y: 0});
            alltimeData[0].push({x: 1, y: question.results.alltime.pos});
            alltimeData[1].push({x: 1, y: question.results.alltime.neg});
            alltimeData[0].push({x: 2, y: 0});
            alltimeData[1].push({x: 2, y: 0});
            this.drawGraph(seriesData, alltimeData);
        },
        drawGraph: function(seriesData, alltimeData) {
            var graph;
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

            var graph2
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
        }
    });







    var Sidebar;
    global.Sidebar = Sidebar = Spine.Controller.sub({
        events:  {
            "click .test li": "clicked"
        },
        clicked: function(e) {
            var value = $(e.target).attr('value');
            console.log(value);
            if (value) {
                var url = "http://192.168.1.9/questions_dashboard/"+ value;
                console.log(url);
                new Chart({el: $('#chart')});
                new Title({el: $('#title')});
                global.Question.fetch({url: url});
                console.log("fetch done");
            }
        },

        init: function() {
            if ( !this.item ) throw "target required";
            this.item.bind("update", this.proxy(this.render));
            this.item.bind("destroy", this.proxy(this.removeEl));
        },
        render: function(item){
            if (item) this.item = item;
            console.log(this.item);
            this.html(Sidebar.template(this.item));
            return this;
        },
        removeEl: function() {
            this.el.remove();
        }
    });

    var SidebarTarget;
    global.SidebarTarget = SidebarTarget = Spine.Controller.sub({
        init: function(){
           Dashboard.Target.bind("refresh", this.proxy(this.addAll));
           Dashboard.Target.bind("create",  this.proxy(this.addOne));
        },
        addOne: function(item){
            if (item) {
                var target = new Sidebar({item: item});
                this.append(target.render());
            }
        },
        addAll: function(){
            Target.each(this.proxy(this.addOne));
        }
    });


















    var SidebarQuestions;
    global.SidebarQuestions = SidebarQuestions = Spine.Controller.sub({
        init: function(){
            console.log("Luodaan SidebarQuestion -olio");
            Dashboard.Question.bind("refresh", this.proxy(this.addAll));
            Dashboard.Question.bind("create",  this.proxy(this.addOne));
        },
        addOne: function(item){
            var question = new Sidebar({item: item});
            this.append(question.render());
        },
        addAll: function(){
            Question.each(this.proxy(this.addOne));
        }
    });
})(Dashboard);