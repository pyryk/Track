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
    return {items: Target.findAllByAttribute("saved", true)};
  },
  init: function() {
    Target.bind("create", this.proxy(this.addOne));
    this.rawTemplate = this.template || $("#template-TargetList");
    this.template = Handlebars.compile(this.rawTemplate.html());
    
    // load initial set of targets
    Target.loadList();
  },
  addOne: function(task){
    this.render();
  },
  clicked: function(e) {
    var el = $(e.target);
    var id = el.attr('data-id');
    if (id) {
      var target = Target.find(id);
      target.loadDetails();
      Spine.Route.navigate(App.getRoute(target));
    } else if (el.hasClass("create-new")) {
      Spine.Route.navigate(App.getRoute("create_target"));
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
    Target.bind("create update", this.proxy(this.targetUpdated));
  },
  getData: function() {
    var target, error;
    try {
      target = Target.find(this.id);
      log("Rendering ", target);
    } catch (e) { // unknown record
      // try to load record
      Target.loadDetails(this.id, this);
      error = e;
      log(e);
    }
    
    return {target: target, error: error};
  },
  error: function(reason) {
    if (reason == "notfound") {
      alert('not found');
    }
  },
  targetUpdated: function() { // TODO update only if this target has updated
    this.render();
  },
  saveAnswer: function(e) {
    var fields = $(e.target).siblings('.target-answer').children('input');
    log("Saving answer", fields);
  }
});

var TargetCreate = BaseController.sub({
  events: {
    "submit #create-target-form": "saveTarget"
  },
  init: function() {
    this.rawTemplate = this.template || $("#template-TargetCreate");
    this.template = Handlebars.compile(this.rawTemplate.html());
  },
  targetSavedToServer: function(target, success) {
    console.log(target.name + (success ? '' : ' _NOT_') + ' saved to server');
    if (success) {
      console.log(App.getRoute(target));
      Spine.Route.navigate(App.getRoute(target)); 
    } else {
      // signal failure to the user
    }
  },
  getData: function() {
    return {};
  },
  saveTarget: function(e) {
    e.preventDefault();
    console.log(e);
    var target = Target.fromForm($(e.target));
    target.bind("saveToServer", this.targetSavedToServer);
    target.saveToServer();
    
    console.log(target.toJSON());
  }
});