var BaseController = Spine.Controller.sub({
  init: function() {
  },
  render: function() {
    var data = this.getData();
    //this.replace(this.compiledTemplate(collection));
    var template = Handlebars.compile(this.template.html());
    this.replace(template(data));
  }
});

/**
 * A controller for the target item list
 *
 */
var ListTargets = BaseController.sub({
  elements: {
    ".targets": "targets"  
  },
  getData: function() {
    return {items: Target.all()};
  },
  init: function() {
    Target.bind("create", this.proxy(this.addOne));
    this.template = this.template || $("#template-TargetList");
    //this.compiledTemplate = Handlebars.compile(this.template.html());
  },
  addOne: function(task){
    this.render();
  },
});