/** =========================================== CUSTOMER ===================================================== */
var Customer = Spine.Model.sub();
Customer.configure("Customer", "logo", "name", "customerId", "saved");

Customer.include({
  getResourceName: function() {
    return "customers";
  },
  getId: function() {
    return this.customerId;
  }
});

Customer.loadList = function(additionalData) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") url += "/";
  url += "customers";
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
        for (var i in data.customers) {
          var customer = data.customers[i];
          customer["id"] = customer["_id"]; // map mongo id
          customer["logo"] = "img/templogos/" + customer.name.toLowerCase().replace(' ', '-').replace('ä', 'a').replace('ö', 'o').replace('\'', '') + ".png";
          // FIXME remove separate customerId
          customer["customerId"] = customer["_id"]; // map mongo id
          customer["saved"] = true; // saved i.e. got from backend
          Customer.create(customer);
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

/** =========================================== TARGET ======================================================= */
/**
 * The track target, such as "Virgin Oil queue"
 */
var Target = Spine.Model.sub();

Target.configure("Target", "customerId", "targetId", "logo", "showLogo", "isLogo", "name", "questions", "questionType", "showQuestionComment", "location", "results", "detailsLoaded", "saved");
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
  getId: function() {
    return this.targetId;
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
  if (url.substring(url.length-1) !== "/") url += "/";
  url += "targets";
  var user = User.getUser();
  var headers = {
    'FB-UserId': user.name,
    'FB-AccessToken': user.token
  };
  console.log(url);

  var requestComplete = false;
  try {
    $.ajax({
      url: url,
      dataType: 'json',
      timeout: 5000,
      data: additionalData,
      cache: false,
      headers: user.logged ? headers : {},
      success: function(data, status, jqXHR) {
        requestComplete = true;
        for (var i in data.targets) {
          var target = data.targets[i];
          target["targetId"] = target["_id"]; // map mongo id
          target["detailsLoaded"] = false; // target details are only loaded individually
          target["saved"] = true; // saved i.e. got from backend
          target["customerId"] = target.customerId;
          target["showLogo"] = false;
          var targetObject = Target.create(target);
          if (Target.findAllByAttribute("targetId", target["_id"]).length > 1) {
            for (var k = 0; k < Target.findAllByAttribute("customerId", target["_id"]).length - 1; i ++) {
              Target.findAllByAttribute("targetId", target["_id"])[i].destroy();
            }
          }
          for (var j in data.targets[i].questions) {
            if (data.targets[i].showQuestionComment) {
              var questionItem = QuestionItem.create({name: data.targets[i].questions[j].name, showComment: true, showResults: true, questionId: data.targets[i].questions[j]._id});
            } else {
              var questionItem = QuestionItem.create({name: data.targets[i].questions[j].name, showResults: true, questionId: data.targets[i].questions[j]._id});
            }
            targetObject.questions[j] = questionItem;
            targetObject.save();
          }
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
/*
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


        for (var j in targetData.questions) {
          var questionItem;
          if (targetData.showQuestionComment) {
            questionItem = QuestionItem.create({name: targetData.questions[j].name, showComment: true, questionId: data.targets[i].questions[j]._id});
          } else {
            questionItem = QuestionItem.create({name: targetData.questions[j].name, questionId: data.targets[i].questions[j]._id});
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
*/
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

/** =========================================== RESULT ======================================================= */
/* result (answer of the target question) */
var Result = Spine.Model.sub();

Result.configure("Result", "value", "timestamp", "location", "textComment", "questionItem", "saved");

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
    url += "results/" + this.questionItem.questionId;

    var user = User.getUser();
    var headers = {
      'FB-UserId': user.name,
      'FB-AccessToken': user.token
    };

    var toSend = {
      value: this.value,
      textComment: this.textComment,
      resultId: this.questionItem.resultId,
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
        this.questionItem.resultId = data._id;
        this.questionItem.save();
      }),
      error: this.proxy(function(jqxhr, status, err) {
        this.trigger("resultSent", false);
        alert(status + ': ' + err);
      })
    });
  }
});

/** =========================================== USER ========================================================= */
/* user (logged in via facebook or other) */
var User = Spine.Model.sub();
User.configure("User", "name", "logged", "token", "expires", "provider", "points");

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
  },
  getPoints: function() {
    return this.points;
  }
});

User.getUser = function() {
  return User.last() || User.create();
};

/** =========================================== LEADERBOARD ===================================================== */
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

/** =========================================== QUESTIONITEM ==================================================== */
var QuestionItem = Spine.Model.sub();
QuestionItem.configure("QuestionItem", "name", "done", "showComment", "questionId", "resultId", "results", "resultAllTime", "resultImage", "showResults");

QuestionItem.include({
  /*setDefaults: function() {
    this.results = this.results || {};

    this.results.now = this.results.now || {};
    this.results.now.pos = this.results.now.pos || 0;
    this.results.now.neg = this.results.now.neg || 0;
    this.results.now.trend = this.results.now.trend || 0;
    this.results.now.period = this.results.now.period || 0;

    this.results.alltime = this.results.alltime || {};
    this.results.alltime.pos = this.results.alltime.pos || 0;
    this.results.alltime.neg = this.results.alltime.neg || 0;
  },*/
  getResourceName: function() {
    return "questions"
  },
  getId: function() {
    return this.questionId;
  },
  loadResults: function(id) {
    var thisHolder = this;
    var url = App.serverURL;
    if (url.substring(url.length-1) !== "/") {
      url += "/";
    }
    url += "results/";
    url += this.questionId;

    var requestComplete = false;
    try {
      $.ajax({
        url: url,
        dataType: 'json',
        timeout: 5000,
        cache: false,
        headers: {},
        success: function(data, status, jqXHR) {
          requestComplete = true;
          thisHolder.results  = data.results;
          if (thisHolder.results.alltime.neg + thisHolder.results.alltime.pos == 0) {
            thisHolder.results.alltime.neg = 1;
            thisHolder.results.alltime.pos = 1;
          }
          thisHolder.resultAllTime = Math.round((thisHolder.results.alltime.pos/(thisHolder.results.alltime.neg + thisHolder.results.alltime.pos))*100);
          if (thisHolder.resultAllTime < 50) {
            thisHolder.resultImage = "img/smiley-thumb-down.png";
          } else {
            thisHolder.resultImage = "img/smiley-thumb-up.png";
          }
          var resultTemp = thisHolder.resultAllTime + " % \<img src=\"" + thisHolder.resultImage + "\" width=\"25\" height=\"25\" alt=\":(\"\>";
          thisHolder.save();
          $("#item-" + id + " .right").html(resultTemp);
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
})

QuestionItem.saveResultAllTime = function(value) {
  this.resultAllTime = value;
};
