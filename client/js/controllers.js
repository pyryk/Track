var BaseController = Spine.Controller.sub({
  init: function() {
  },
  render: function() {
    var data = this.getData();
    this.html(this.template(data));
  }
});

/**
 * A controller for the target item list
 *
 */
var TargetsList = BaseController.sub({
  elements: {
    ".targets": "targets"  
  },
  getData: function() {
    return {items: Target.all()};
  },
  init: function() {
    Target.bind("create", this.proxy(this.addOne));
    this.rawTemplate = this.template || $("#template-TargetList");
    this.template = Handlebars.compile(this.rawTemplate.html());
  },
  addOne: function(task){
    this.render();
  },
});