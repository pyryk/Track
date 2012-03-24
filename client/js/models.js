/**
 * The track target, such as "Virgin Oil queue"
 *
 */
var Target = Spine.Model.sub();

Target.configure("Target", "name", "question", "results", "detailsLoaded", "saved");

Target.include({
    getType: function() {
      return "target"
    },
    getResourceName: function() {
      return "targets"
    },
    loadDetails: function(listener) {
      Target.loadDetails(this.id, listener);
    },
    saveToServer: function() {
      var url = App.serverURL;
      
      if (url.substring(url.length-1) !== "/") {
        url += "/";
      }
      url += "target";
      
      var toSend = {
        name: this.name,
        question: this.question
      }
      var data = JSON.stringify(toSend);
      
      var that = this;
      $.ajax({
        url: url,
        type: "POST",
        contentType: "application/json",
        dataType: "json",
        data: data,
        success: function(data) {
          that.id = data._id;
          that.saved = true;
          that.detailsLoaded = true;
          that.save();
          that.trigger("saveToServer", true);
        }, 
        error: function(jqxhr, status, err) {
          that.trigger("saveToServer", false);
          alert(status + ': ' + err);
        }
      });
    },
    getResultAggregate: function() {
      var aggregate = {
        positives: _.filter(this.results, function(it) { return it.value === 1 }).length,
        negatives: _.filter(this.results, function(it) { return it.value === 0 }).length,
      };
      
      return aggregate;
    },
    saved: false,
    detailsLoaded: false,
    results: {},
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
        target["saved"] = true; // saved i.e. got from backend
        
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
      targetData["saved"] = true; // saved i.e. got from backend
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
      
      // TODO remove this hack when there is metric support in backend
      /*target.metric = {
        unit: "min",
        question: "Tämä on placeholder-metriikka"
      };*/
      
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

/**
 * Creates a new Target from the create target form fields
 *
 */
Target.fromForm = function(form) {
  var fields = form.find('input, textarea');
  var data = {};
  $(fields).each(function(i, field) {
    var $field = $(field);
    var name = $field.attr('name');

    // form structures with field names containing __
    // e.g. metric__unit => metric["unit"]
    var nameParts = name.split("__");
    var fieldVal;
    if (nameParts.length > 1) {
      fieldVal = {};
      var previous = fieldVal;
      for (var i=1; i<nameParts.length-1; i++) {
        previous[nameParts[i]] = previous[nameParts[i]] || {};
        previous = previous[nameParts[i]];
      }
      fieldVal[nameParts[nameParts.length-1]] = $field.val();
      data[nameParts[0]] = jQuery.extend(data[nameParts[0]] || {}, fieldVal);
    } else {
      fieldVal = $field.val();
      data[nameParts[0]] = fieldVal;
    }
  });
  return Target.create(data);
} 

/* -------------------------------------- */
/* result (answer of the target question) */
var Result = Spine.Model.sub();

Result.configure("Result", "value", "timestamp", "target", "saved");

Result.include({
  getType: function() {
    return "result"
  },
  getResourceName: function() {
    return "results"
  },
  post: function() {
    if (!this.target) {
      log("a result without target!", this);
      return;
    }
    
    var url = App.serverURL;
  
    if (url.substring(url.length-1) !== "/") {
      url += "/";
    }
    url += "target/" + this.target.id + "/" + "result";
  
    var toSend = {
      value: this.value
    }
    var data = JSON.stringify(toSend);
    
    $.ajax({
      url: url,
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: data,
      success: this.proxy(function(data) {
        this.saved = true;
        this.save();
        
        this.target.loadDetails();
        this.trigger("resultSent", true);
      }), 
      error: this.proxy(function(jqxhr, status, err) {
        this.trigger("resultSent", false);
        alert(status + ': ' + err);
      })
    });
  }
});
