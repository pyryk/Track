/**
 * The track target, such as "Virgin Oil queue"
 *
 */
var Target = Spine.Model.sub();

Target.configure("Target", "name", "metrics", "detailsLoaded");

Target.include({
    getType: function() {
      return "target"
    },
    getResourceName: function() {
      return "targets"
    },
    loadDetails: function(listener) {
      Target.loadDetails(this.id, listener);
    }
});

/**
 * Loads a brief list of the track targets, containing only name and id
 * TODO: add more fields here, category/icon etc
 */
Target.loadList = function() {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") {
    url += "/";
  }
  url += "targets";
  
  $.ajax({
    url: url,
    dataType: 'json',
    success: function(data, status, jqXHR) {
      for (var i in data.targets) {
        var target = data.targets[i];
        target["id"] = target["_id"]; // map mongo id
        target["detailsLoaded"] = false; // target details are only loaded individually
        
        Target.create(target);
      }
    }
  });
}

Target.loadDetails = function(id, listener) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") {
    url += "/";
  }
  url += "target/" + id;
  
  $.ajax({
    url: url,
    dataType: 'json',
    success: function(data, status, jqXHR) {
      var targetData = data.target;
      targetData["id"] = targetData["_id"]; // map mongo id
      var target;
      try {
        var target = Target.find(id);
        
        // upate all attributes, just in case
        for (var i in targetData) {
          target[i] = targetData[i];
        }
      } catch (e) { // target not found locally
        target = Target.create(targetData);
      }
      
      // mark details loaded (i.e. no need for loading spinner)
      target.detailsLoaded = true
      
      // TODO remove this hack when there is metrics support in backend
      target.metrics = {
        unit: "min",
        question: "Tämä on placeholder-metriikka"
      };
      
      target.save();
    },
    statusCode: {
      404: function() {
        if (listener && typeof listener.error === "function") {
          listener.error('notfound');
        }
      }
    }
  });
}

 