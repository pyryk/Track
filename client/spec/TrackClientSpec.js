describe("Targets", function() {
  beforeEach(function() {
    console.log('setting the server up');
    this.server = sinon.fakeServer.create();
  });
  
  afterEach(function() {
    this.server.restore();
  });
  
  it("should be possible to create targets", function() {
    var target = Target.create({
      name: "Test target", 
      question: "Is this good?",
    });
    expect(target.id).toBe(Target.last().id);
  });
  
  it("should be possible to navigate to a target", function() {
    
    this.server.respondWith("GET", "/targets",
      [200, {"Content-Type": "application/json"},
      '{"targets":[{"name":"Trackin uusi ulkoasu","_id":"4f690001f24705a2020000c2","question":"Mitä tykkäät?","relevance":0}]}'
      ]);
    
    window.track = new App();
    
    // loads target list
    Spine.Route.navigate('#!/');
    // responds to target list call
    this.server.respond(); 
  
    
    var target = Target.first();
    // mock event
    var e = {target: '<li data-id="' + target.id + '"></li>'};
    var list = window.track.visiblePage;
    window.track.visiblePage.clicked(e);
    
    expect(window.track.visiblePage).toNotBe(list)
    
  });
});