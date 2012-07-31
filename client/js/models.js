/** =========================================== CUSTOMER ===================================================== */
var Customer = Spine.Model.sub();
Customer.configure("Customer", "logo", "name", "targets", "saved");

Customer.loadList = function(additionalData) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") url += "/";
  url += "customers";
  var user = User.getUser();
  var headers = {'FB-UserId': user.name,'FB-AccessToken': user.token};
  var requestComplete = false;
  try {
    $.ajax({
      url: url,data: additionalData,dataType: 'json',timeout: 5000,cache: false,headers: user.logged ? headers : {},
      success: function(data, status, jqXHR) {
        requestComplete = true;
        for (var i in data) {
          var customer = data[i];
          customer["id"] = customer["_id"]; // map mongo id
          customer["logo"] = "img/templogos/" + customer.name.toLowerCase().replace(' ', '-').replace('ä', 'a').replace('ö', 'o').replace('\'', '') + ".png";
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

Customer.loadCustomer = function(id, additionaldata) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") url += "/";
  url += "customers/" + id;
  var requestComplete = false;
  try {
    $.ajax({
      url: url,dataType: 'json',data: additionaldata,timeout: 5000,cache: false,
      success: function(data, status, jqXHR) {
        requestComplete = true;
        var customer = data.customer;
        customer["id"] = customer["_id"]; // map mongo id
        customer["logo"] = "img/templogos/" + customer.name.toLowerCase().replace(' ', '-').replace('ä', 'a').replace('ö', 'o').replace('\'', '') + ".png";
        customer["saved"] = true; // saved i.e. got from backend
        Customer.create(customer);
      },
      error: function(jqxhr, textStatus, error) {
        console.log('error: ' + textStatus + ', ' + error);
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
var Target = Spine.Model.sub();
Target.configure("Target", "customerId", "logo", "showLogo", "isLogo", "name", "questions", "questionType", "showQuestionComment", "location", "results", "detailsLoaded", "saved");

Target.include({
  getType: function() {
    return "target";
  },
  getQuestions: function() {
    return this.questions;
  },
  getName: function() {
    return this.name;
  },
  getShowQuestionComment: function() {
    return this.showQuestionComment;
  },
  loadDetails: function(id, listener) {
    Target.loadDetails(id, listener);
  },
  // For future....
  saveToServer: function() {
    var url = App.serverURL;
    if (url.substring(url.length-1) !== "/") {url += "/";}
    url += "targets";
    var user = User.getUser();
    var headers = {'FB-UserId': user.name,'FB-AccessToken': user.token};
    var location = window.track.location;
    var toSend = {name: this.name,questions: this.questions,location: location}
    var data = JSON.stringify(toSend);
    $.ajax({
      url: url,type: "POST",contentType: "application/json",dataType: "json",data: data,headers: user.logged ? headers : {},
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

Target.loadDetails = function(id, listener) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") url += "/";
  url += "targets/" + id;
  var user = User.getUser();
  var headers = {
    'FB-UserId': user.name,
    'FB-AccessToken': user.token
  };
  $.ajax({
    url: url,dataType: 'json',timeout: 5000,cache: false,headers: user.logged ? headers : {},
    success: function(data, status, jqXHR) {
      var target = data.target;
      target["id"] = target._id; // map mongo id
      target["customerId"] = target.customerId;
      target["showLogo"] = false;
      var targetObject = Target.create(target);
      for (var i in targetObject.questions) {
        if (targetObject.showQuestionComment) {
           var questionItem = QuestionItem.create({name: targetObject.questions[i].name, showComment: true, id: targetObject.questions[i]._id, showResults: true});
        } else {
          var questionItem = QuestionItem.create({name: targetObject.questions[i].name, id: targetObject.questions[i]._id, showResults: true});
        }
        questionItem.save();
        targetObject.questions[i] = questionItem;
      }
      targetObject.detailsLoaded = true;
      targetObject.save();
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
 * For future...
 */
Target.fromForm = function(form) {
  var fields = form.find('input, textarea');
  var data = {};
  $(fields).each(function(i, field) {
    var $field = $(field);
    var name = $field.attr('name');
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
  put: function() {
    if (!this.questionItem) return;
    var url = App.serverURL;
    if (url.substring(url.length-1) !== "/") url += "/results/";
    url += this.questionItem.resultId;
    var user = User.getUser();
    var headers = {'FB-UserId': user.name,'FB-AccessToken': user.token};
    var toSend = {textComment: this.textComment,location: this.location};
    var data = JSON.stringify(toSend);
    $.ajax({
      url: url,type: "PUT",contentType: "application/json",dataType: "json",data: data,headers: user.logged ? headers : {},
      success: this.proxy(function(data) {
        this.saved = true;
        this.save();
      }),
      error: this.proxy(function(jqxhr, status, err) {
        alert(status + ': ' + err);
      })
    });
  },
  post: function() {
    if (!this.questionItem) return;
    var url = App.serverURL;
    if (url.substring(url.length-1) !== "/") url += "/questions/";
    url += this.questionItem.id + "/results/";
    var user = User.getUser();
    var headers = {'FB-UserId': user.name,'FB-AccessToken': user.token};
    var toSend = {value: this.value,resultId: this.questionItem.resultId,location: this.location};
    var data = JSON.stringify(toSend);
    $.ajax({
      url: url,type: "POST",contentType: "application/json",dataType: "json",data: data,headers: user.logged ? headers : {},
      success: this.proxy(function(data) {
        this.saved = true;
        this.save();
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
    if (user.name && user.token) {user.logged = true;user.provider = "facebook";}
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
  if (url.substring(url.length-1) !== "/") url += "/";
  url += "leaderboard/";
  $.ajax({
    url: url,dataType: 'json',
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
QuestionItem.configure("QuestionItem", "name", "done", "showComment", "id", "resultId", "results", "resultAllTime", "resultImage", "showResults");

QuestionItem.include({
  loadResults: function(id) {
    var thisHolder = this;
    var url = App.serverURL;
    if (url.substring(url.length-1) !== "/") url += "/questions/";
    url += id + "/results";
    var requestComplete = false;
    try {
      $.ajax({
        url: url,dataType: 'json',timeout: 5000,cache: false,headers: {},
        success: function(data, status, jqXHR) {
          requestComplete = true;
          thisHolder.results = data.question.results;
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
      } else {
        log("Request was completed");
      }
    }
  }
})

