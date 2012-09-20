(function(global) {

    var App;
    global.App = App = Spine.Controller.sub({
        init: function() {
            // Set templates
            TargetItem.extend({template: Handlebars.compile($("#targetitem-tmpl").html())}),

            // Create instances
            new Targets({el: $('#targets')});
            global.Target.fetch();
        }
    });

    var TargetItem;
    global.TargetItem = TargetItem = Spine.Controller.sub({
        tag: 'li',

        // Bind events to the record
        init: function() {
            if ( !this.item ) throw "target required";
            this.item.bind("update", this.proxy(this.render));
            this.item.bind("destroy", this.proxy(this.removeEl));
        },

        render: function(item){
            if (item) this.item = item;

            this.html(TargetItem.template(this.item));
            console.log(this.item);
            return this;
        },

        removeEl: function() {
            this.el.remove();
        }
    });

    var Targets;
    global.Targets = Targets = Spine.Controller.sub({
        el: $('#targets'),

        init: function(){
            Dashboard.Target.bind("refresh", this.proxy(this.addAll));
            Dashboard.Target.bind("create",  this.proxy(this.addOne));
        },

        addOne: function(item){
            debugger;
            var target = new TargetItem({item: item});
            this.append(target.render());
        },

        addAll: function(){
            Target.each(this.proxy(this.addOne));
        }
    });

})(Dashboard);