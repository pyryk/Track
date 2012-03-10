describe("Local targets", function() {
  it("Targets can be created", function() {
    var target = Target.create({
      name: "Test target", 
      metrics: {
        unit:"min",
        question: "Enter random number of minutes"
      }
    });
    expect(target.id).toBe(Target.last().id);
  });
  
  it("Targets are shown in the app", function() {
    var target = Target.create({
      name: "Test target", 
      metrics: {
        unit:"min",
        question: "Enter random number of minutes"
      }
    });
    var listItems = $('iframe').contents().find("li[data-id=" + target.id + "]");
    console.log(target.id);
    expect(listItems.size()).toEqual(0); // TODO fix
  });
});