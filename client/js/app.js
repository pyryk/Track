var App = Spine.Controller.sub({
  pages: {},
  visiblePage: undefined,
  init: function() {
    this.routes({
      "!/targets/": function(params) {
        this.renderView('targetList', TargetsList);
      },
      "!/targets/create": function(params) {
        this.renderView('targetCreate', TargetCreate);
      },
      "!/targets/:id": function(params) {
        this.renderView('targetDetails', TargetDetails, params.id);
      },
      "!/results/:id": function(params) {
        this.renderView('ownResult', ownResult, params.id);
      },
      "!/targets/:id/results": function(params) {
        this.renderView('targetResults', TargetResults, params.id);
      },
      // default route
      "*others": function(params) {
        log("Invalid route ", params.match.input, " - redirecting to default");
        Spine.Route.navigate("!/targets/");
      }
    });
    
    Spine.Route.setup();
    
    
    // enable back button
    new BackButton({
      el: $('#back-button'),
      template: $('#template-backButton'),
      app: this,
    }).render();
    /*$('#back-button').click(this.proxy(function(e) {
      this.goToPreviousPage();
    }));*/
  },
  renderView: function(name, className, id) {
    // create controller if it doesnt already exist
    if (!this.pages[name]) {
      var tmpl = $('#template-' + name);
      log("creating view " + name, "with template", tmpl);
      this.pages[name] = new className({
        el: $("#main"),
        template: tmpl
      });
    }
    
    log("rendering view " + name);
    this.pages[name].id = id; // set id if needed
    this.pages[name].render();
    this.visiblePage = this.pages[name];
    
    // add page to the page stack:
    if (this.pageStack[this.pageStack.length-1] !== this.pages[name] &&
      this.pageStack[this.pageStack.length-2] !== this.pages[name]) {
      this.pageStack.push(this.pages[name]);
    }
    Spine.trigger('page:change');
  },
  pageStack: [],
  getPreviousPage: function() {
    // second last element of the stack
    /*console.log("Page stack:", _.map(this.pageStack, function(it) { return it.getTitle(); }))
    return this.pageStack[this.pageStack.length-2];*/
    
    var current = this.visiblePage;

    // some hard-coded bits of back button logic
    switch(current) {
      case this.pages['targetCreate']:
      case this.pages['targetDetails']:
        return this.pages['targetList'];
      case this.pages['ownResult']:
      case this.pages['targetResults']:
        return this.pages['targetDetails'];
      default: 
        return undefined;
    }
  },
  // previous pages are always target details or list page. modify if this changes
  goToPreviousPage: function() {
    /*var popped = this.pageStack.pop();
    history.back();*/
    var current = this.visiblePage;
    
    var prev = this.getPreviousPage();
    
    if (!prev) {
      return;
    }
    
    if (prev.id) {
      Spine.Route.navigate(App.getRoute(Target.find(prev.id)))
    } else {
      Spine.Route.navigate("!/targets/");
    }
  },
});

App.serverURL = window.trackConfig.serverURL || "http://mkos.futupeople.com/track/";
//App.serverURL = "http://localhost:9999/";

/**
 * Return a route fragment to a specific domain object (target etc.)
 *
 */
App.getRoute = function(obj) {
  // special cases first
  if (obj === "create_target") {
    return "!/targets/create";
  }
  
  return "!/" + obj.getResourceName() + "/" + obj.id
}

//TODO url resolver?
