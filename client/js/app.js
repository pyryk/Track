var App = Spine.Controller.sub({
  pages: {},
  init: function() {
    this.routes({
      "!/targets/": function(params) {
        if (!this.pages.targetList) {
          log("creating view targetlist");
          this.pages.targetList = new ListTargets({
            el: $("#placeholder")
          });
        } else {
          this.pages.targetList.render();
        }
      },
      "!/targets/:id": function(params) {
        log("targets", params.id);
      },
      // default route
      "*others": function(params) {
        log("Invalid route ", params.match.input, " - redirecting to default");
        Spine.Route.navigate("!/targets/");
      }
    });
    
    Spine.Route.setup();
  }
});

//TODO url resolver/generator

jQuery(function($) {
  var app = new App();
  //Spine.Route.navigate("/targets/11");
});
