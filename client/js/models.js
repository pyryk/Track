/**
 * The track target, such as "Virgin Oil queue"
 *
 */
var Target = Spine.Model.sub();

Target.configure("Target", "name", "metrics");

Target.include({
    getType: function() {
      return "target"
    },
    getResourceName: function() {
      return "targets"
    },
});

 