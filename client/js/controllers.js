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
  events: {
    "click #target-list li": "clicked"
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
  clicked: function(e) {
    var id = $(e.target).attr('data-id');
    if (id) {
      Spine.Route.navigate(App.getRoute(Target.find(id)));
    }
  }
});

var TargetDetails = BaseController.sub({
  events: {
    "click .save-answer": "saveAnswer"
  },
  init: function() {
    this.rawTemplate = this.template || $("#template-TargetDetails");
    this.template = Handlebars.compile(this.rawTemplate.html());
  },
  getData: function() {
    var target, error;
    try {
      target = Target.find(this.id);
      log("Rendering ", target);
    } catch (e) {
      error = e;
      log(e);
    }
    
    return {target: target, error: error};
  },
  saveAnswer: function(e) {
    var fields = $(e.target).siblings('.target-answer').children('input');
    log("Saving answer", fields);
  }
});