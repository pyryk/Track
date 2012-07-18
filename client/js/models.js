/**
 * The track target, such as "Virgin Oil queue"
 *
 */
var Target = Spine.Model.sub();

Target.configure("Target", "logo", "name", "questions", "questionType", "showQuestionComment", "location", "results", "detailsLoaded", "saved");
// Target.configure("Target", "name", "questions", "detailsLoaded", "saved");

Target.include({
  setDefaults: function() {
    this.results = this.results || {};

    this.results.now = this.results.now || {};
    this.results.now.pos = this.results.now.pos || 0;
    this.results.now.neg = this.results.now.neg || 0;
    this.results.now.trend = this.results.now.trend || 0;
    this.results.now.period = this.results.now.period || 0;

    this.results.alltime = this.results.alltime || {};
    this.results.alltime.pos = this.results.alltime.pos || 0;
    this.results.alltime.neg = this.results.alltime.neg || 0;

  },
  getType: function() {
    return "target";
  },
  getResourceName: function() {
    return "targets";
  },
  getQuestions: function() {
    return this.questions;
  },
  getName: function() {
    return this.name;
  },
  getQuestionType: function() {
    return this.questionType;
  },
  getShowQuestionComment: function() {
    return this.showQuestionComment;
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

    var user = User.getUser();
    var headers = {
      'FB-UserId': user.name,
      'FB-AccessToken': user.token
    };

    // append the create location to the post
    var location = window.track.location;

    var toSend = {
      name: this.name,
      questions: this.questions,
      location: this.location
    }
    var data = JSON.stringify(toSend);

    $.ajax({
      url: url,
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: data,
      headers: user.logged ? headers : {},
      success: this.proxy(function(data) {
        this.id = data._id;
        this.saved = true;
        this.detailsLoaded = true;

        this.save();
        this.trigger("saveToServer", true);
      }),
      error: this.proxy(function(jqxhr, status, err) {
        this.trigger("saveToServer", false);
        alert(status + ': ' + err);
      })
    });
  },
  saved: false,
  detailsLoaded: false,
  results: {}
});

/**
 * Loads a brief list of the track targets, containing only name and id
 * TODO: add more fields here, category/icon etc
 */
Target.loadList = function(additionalData) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") {
    url += "/";
  }
  url += "targets";
  //var data = window.track.getAdditionalData();
  var user = User.getUser();
  var headers = {
    'FB-UserId': user.name,
    'FB-AccessToken': user.token
  };

  var requestComplete = false;
  try {
    $.ajax({
      url: url,
      data: additionalData,
      dataType: 'json',
      timeout: 5000,
      cache: false,
      headers: user.logged ? headers : {},
      success: function(data, status, jqXHR) {
        requestComplete = true;
        for (var i in data.targets) {
          var target = data.targets[i];
          target["id"] = target["_id"]; // map mongo id
          target["detailsLoaded"] = false; // target details are only loaded individually
          target["saved"] = true; // saved i.e. got from backend


          var targetObject = Target.create(target);
          for (var j in data.targets[i].questions) {
            var questionItem;
            if (data.targets[i].showQuestionComment) {
              questionItem = QuestionItem.create({name: data.targets[i].questions[j].name, showComment: true, id_: data.targets[i].questions[j]._id});
            } else {
              questionItem = QuestionItem.create({name: data.targets[i].questions[j].name, id_: data.targets[i].questions[j]._id});
            }
            questionItem.save();
            targetObject.questions[j] = questionItem;
            targetObject.save();
          }
          targetObject.save();
        }

      },
      error: function(jqxhr, textStatus, error) {
        log('error: ' + textStatus + ', ' + error);
      }
    });
  } catch(e) {
    log(e);
  }

  // workaround for android 2.3 bug: requests remain pending when loading the page from cache
  var xmlHttpTimeout=setTimeout(ajaxTimeout,5000);
  function ajaxTimeout(){
    // if request not complete and no sinon (xhr mock lib) present
    if (!requestComplete && !window.sinon) {
      log("Request timed out - reloading the whole page");
      //window.location.reload()
    } else {
      log("Request was completed");
    }
  }
}

Target.loadDetails = function(id, listener) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") {
    url += "/";
  }
  url += "target/" + id;

  var user = User.getUser();
  var headers = {
    'FB-UserId': user.name,
    'FB-AccessToken': user.token
  };

  $.ajax({
    url: url,
    dataType: 'json',
    headers: user.logged ? headers : {},
    success: function(data, status, jqXHR) {
      var targetData = data.target;
      //targetData["id"] = targetData["_id"]; // map mongo id
      //targetData["saved"] = true; // saved i.e. got from backend

      try {
        var target = Target.find(id);
        target.questionType = targetData.questionType;
        // upate all attributes, just in case
        /* for (var i in targetData) {
         target[i] = targetData[i];
         }*/
        for (var j in targetData.questions) {
          var questionItem;
          if (targetData.showQuestionComment) {
            questionItem = QuestionItem.create({name: targetData.questions[j].name, showComment: true, id_: data.targets[i].questions[j]._id});
          } else {
            questionItem = QuestionItem.create({name: targetData.questions[j].name, id_: data.targets[i].questions[j]._id});
          }
          questionItem.save();
          target.questions[j] = questionItem;
          target.save();
        }
      } catch (e) { // target not found locally
        target = Target.create(targetData);
        console.log("exeption");
      }
      // mark details loaded (i.e. no need for loading spinner)
      target.detailsLoaded = true;

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
  var target = Target.create(data);
  target.setDefaults();
  return target;
}

/* -------------------------------------- */
/* result (answer of the target question) */
var Result = Spine.Model.sub();

Result.configure("Result", "value", "timestamp", "location", "textComment","questionItem", "saved");

Result.include({
  getType: function() {
    return "result"
  },
  getResourceName: function() {
    return "results"
  },
  post: function() {
    if (!this.questionItem) {
      log("a result without target!", this);
      return;
    }
    var url = App.serverURL;
    var headers;
    if (url.substring(url.length-1) !== "/") {
      url += "/";
    };
    url += "result/" + this.questionItem.id_;

    var user = User.getUser();
    var headers = {
      'FB-UserId': user.name,
      'FB-AccessToken': user.token
    };

    var toSend = {
      value: this.value,
      textComment: this.textComment,
      location: this.location
    };
    var data = JSON.stringify(toSend);
    $.ajax({
      url: url,
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: data,
      headers: user.logged ? headers : {},
      success: this.proxy(function(data) {
        this.saved = true;
        this.save();

        //this.target.loadDetails();
        this.trigger("resultSent", true);
      }),
      error: this.proxy(function(jqxhr, status, err) {
        this.trigger("resultSent", false);
        alert(status + ': ' + err);
      })
    });
  }
});

/* -------------------------------------- */
/* user (logged in via facebook or other) */
var User = Spine.Model.sub();
User.configure("User", "name", "logged", "token", "expires", "provider");

User.include({
  loadFromCookies: function() {
    var user = User.getUser();
    user.name = $.cookie('fb_user');
    user.token = $.cookie('fb_token');

    if (user.name && user.token) {
      user.logged = true;
      user.provider = "facebook";
    }

    user.save();
  },
  /**
   * Saves user id and access token to a cookie for quicker return to app
   * @param expires, access token expiry, in days after today
   */
  saveCookies: function(expires) {
    $.cookie('fb_user', this.name, {expires: expires});
    $.cookie('fb_token', this.token, {expires: expires});
  },
  destroyCookies: function() {
    $.cookie('fb_user', null);
    $.cookie('fb_token', null);
  }
});

User.getUser = function() {
  return User.last() || User.create();
};

var LeaderboardEntry = Spine.Model.sub();
LeaderboardEntry.configure("LeaderboardEntry", "position", "name", "picture", "points");

LeaderboardEntry.load = function() {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") {
    url += "/";
  }
  url += "leaderboard/";

  $.ajax({
    url: url,
    dataType: 'json',
    success: function(data) {
      for (var i in data.users) {
        var user = data.users[i];
        user.id = user._id; // map the id 
        LeaderboardEntry.create(user);
      }
    }
  });
}

var Customer = Spine.Model.sub();
Customer.configure("Customer", "logo", "name");

var QuestionItem = Spine.Model.sub();
QuestionItem.configure("QuestionItem", "name", "done", "showComment", "id_");


