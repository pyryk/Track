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
      // default route
      "*others": function(params) {
        log("Invalid route ", params.match.input, " - redirecting to default");
        Spine.Route.navigate("!/targets/");
      }
    });
    
    Spine.Route.setup();
  },
  renderView: function(name, className, id) {
    // create controller if it doesnt already exist
    if (!this.pages[name]) {
      log("creating view " + name);
      this.pages[name] = new className({
        el: $("#main"),
      });
    }
    log("rendering view " + name);
    this.pages[name].id = id; // set id if needed
    this.pages[name].render();
    this.visiblePage = this.pages[name];
  }
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
