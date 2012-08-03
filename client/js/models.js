/** =========================================== CUSTOMER ===================================================== */
var Customer = Spine.Model.sub();
Customer.configure("Customer", "logo", "name", "targets", "saved");

Customer.loadList = function(additionalData) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") url += "/";
  url += "customers";
  console.log(url);
  var user = User.getUser();
  var headers = {'FB-UserId': user.name,'FB-AccessToken': user.token};
  var requestComplete = false;
  try {
    $.ajax({
      url: url,data: additionalData,dataType: 'json',timeout: 5000,cache: false,headers: user.logged ? headers : {},
      success: function(data, status, jqXHR) {
        requestComplete = true;
        for (var i in data.customers) {
          var customer = data.customers[i];
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
Target.configure("Target", "name","customerId", "customerName", "logo", "showLogo", "questions", "questionType", "showQuestionComment", "location", "detailsLoaded", "saved");

Target.include({
  getType: function() {return "target";},
  getQuestions: function() {return this.questions;},
  getName: function() {return this.name;},
  getCustomerId: function() {return this.customerId;},
  getQuestionType: function() {return this.questionType;},
  getShowQuestionComment: function() {return this.showQuestionComment;},
  getCustomerName: function() {return this.customerName;},
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
  var headers = {'FB-UserId': user.name,'FB-AccessToken': user.token};
  $.ajax({
    url: url,dataType: 'json',timeout: 5000,cache: false,headers: user.logged ? headers : {},
    success: function(data, status, jqXHR) {
      var target = data.target;
      target["id"] = target._id; // map mongo id
      target["showLogo"] = false;
      var targetObject = Target.create(target);
      for (var i in targetObject.questions) {
        var questionItem = QuestionItem.create({name: targetObject.questions[i].name,
          showComment: targetObject.showQuestionComment, id: targetObject.questions[i]._id,
          targetId: target._id, targetName: target.name, customerName: target.customerName, showResults: true});
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
User.configure("User", "name", "id", "logged", "token", "expires", "provider", "points");

User.include({
  loadFromCookies: function() {
    var user = User.getUser();
    user.id = $.cookie('fb_user');
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
  }
});

User.getUser = function() {
  return User.last() || User.create({points: 0});
};

User.loadPoints = function(points) {
  var user = User.getUser();
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") url += "/";
  url += "users/" + user.name;
  $.ajax({
    url: url, dataType: 'json',
    success: function(data) {
      if (data.user !== null) {
        user.points = data.user.points + user.points;
        user.id = data.user.fbUserId;
      } else {
        user.points = user.points + points;
      }
      user.save();
      console.log("MODELS - loadPoints");
      console.log(user.points);
    }
  });
}

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
QuestionItem.configure("QuestionItem", "name", "done", "showComment", "id", "resultId", "targetId", "targetName", "customerName", "results", "resultAllTime", "resultImage", "showResults");

QuestionItem.loadResults = function(id, onlyResults, questionItem) {
  var url = App.serverURL;
  if (url.substring(url.length-1) !== "/") url += "/";
  if (onlyResults) {url += "questions/" + id + "/results";} else {url += "questions/" + id;}
  var requestComplete = false;
  var user = User.getUser();
  var headers = {'FB-UserId': user.name,'FB-AccessToken': user.token};
  try {
    $.ajax({
      url: url,dataType: 'json',timeout: 5000,cache: false,headers: user.logged ? headers : {},
      success: function(data, status, jqXHR) {
        if (onlyResults) {
          requestComplete = true;
          questionItem.results = data.question.results;
          if (questionItem.results.alltime.neg + questionItem.results.alltime.pos == 0) {
            questionItem.results.alltime.neg = 1;
            questionItem.results.alltime.pos = 1;
          }
          questionItem.resultAllTime = Math.round((questionItem.results.alltime.pos/(questionItem.results.alltime.neg + questionItem.results.alltime.pos))*100);
          if (questionItem.resultAllTime < 50) {
            questionItem.resultImage = "img/smiley-thumb-down.png";
          } else {
            questionItem.resultImage = "img/smiley-thumb-up.png";
          }
          var resultTemp = questionItem.resultAllTime + " % \<img src=\"" + questionItem.resultImage + "\" width=\"25\" height=\"25\" alt=\":(\"\>";
          questionItem.save();
          $("#item-" + id + " .right").html(resultTemp);
        } else {
          requestComplete = true;
          data.question["id"] = data.question._id; // map mongo id
          var questionObject = QuestionItem.create(data.question);
          questionObject.detailsLoaded = true;
          questionObject.save();
          console.log(questionObject.results);
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
    } else {
      log("Request was completed");
    }
  }
}



