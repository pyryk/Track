var App = Spine.Controller.sub({
  pages: {},
  init: function() {
    this.routes({
      "!/targets/": function(params) {
        this.renderView('targetList', TargetsList);
      },
      "!/targets/:id": function(params) {
        this.renderView('targetDetails', TargetDetails, params.id);
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
  }
});

App.serverURL = "http://mkos.futupeople.com/track/";

/**
 * Return a route fragment to a specific domain object (target etc.)
 *
 */
App.getRoute = function(obj) {
  return "!/" + obj.getResourceName() + "/"+obj.id;
}

//TODO url resolver?
