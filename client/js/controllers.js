/* Basecontroller
 *=================================================================================================================== */
var BaseController = Spine.Controller.sub({
  init: function() {
    this.rawTemplate = this.template;
    if (this.rawTemplate && this.rawTemplate.length > 0) {
      this.template = Handlebars.compile(this.rawTemplate.html());
    }
  },
  show: function() {
    this.render();
  },
  render: function() {
    var data = this.getData();
    if (typeof this.template === "function") {
      this.html(this.template(data));
      this.addFastButtons();
    }
  },
  getData: function() {
    return {};
  },
  addFastButtons: function() {
    for (var i in this.events) {
      var parts = i.split(" ");
      if (parts[0] == "fastclick") {
        var buttons = $(parts[1]);
        // fast clicks are not supported on every browser
        if (App.fastClicksEnabled()) {
          buttons.each(this.proxy(function(no, btn) {
            new MBP.fastButton(btn, this.proxy(this[this.events[i]]));
          }));
        } else {
          buttons.bind("click", this.proxy(this[this.events[i]]));
        }
      }
    }
  }
});

/* CustomersList
 *=================================================================================================================== */
var CustomersList = BaseController.sub({
  events: {
    "click #customer-list": "clickedCustomer",
    "fastclick #customer-list li span": "clickedCustomer",
    "keyup #search-customer-input": "searchCustomer"
  },
  getData: function() {
    return {items: [
      Customer.create({logo: "img/templogos/night_people_group.png", name: "Night people group Finland"}),
      Customer.create({logo: "img/templogos/subway.png", name: "Subway"}),
      Customer.create({logo: "img/templogos/rosso.png", name: "Rosso"}),
      Customer.create({logo: "img/templogos/mcdonalds.png", name: "McDonald's"})
    ]};
  },
  clickedCustomer: function() {
    Spine.Route.navigate("!/targets/");
  },

  /* List search using jQuery-example */
  searchCustomer: function() {
    var $lastElement = null;
    var searchCustomerInput = $('#search-customer-input').val().toLowerCase(); // to record the written text
    $('li').each(function(index){ // go through every li-element
      var $this = $(this);
      if($this.text().toLowerCase().indexOf(searchCustomerInput) === -1) { // if customers name doesn't match
        $this.hide(); // hide target
      } else {
        $this.show();
        $(this).addClass('first-visible-child last-visible-child');
        if ($lastElement != null) { // if this customer isn't the first in a list
          $(this).removeClass('first-visible-child');
          $($lastElement).removeClass('last-visible-child'); // to remove roundings from bottom
        }
        $lastElement = this; // record this customer so that next customer is able to remove roundings from bottom
      }
    });
  }
});

/* TargetsList
 *=================================================================================================================== */
var TargetsList = BaseController.sub({
  elements: {
    ".targets": "targets"
  },
  events: {
    "fastclick #target-list li": "clicked",
    "keyup #search-target-input": "searchTarget"
  },
  getTitle: function() {
    return "List";
  },
  getData: function() {
    return {items: Target.findAllByAttribute("saved", true)};
  },
  init: function() {
    BaseController.prototype.init.call(this);
    Target.bind("create", this.proxy(this.addOne));
    Spine.bind('location:changed', this.proxy(this.locationChanged));

    // load list (without location data) even when no location gotten
    Spine.bind('location:error', this.proxy(this.locationChanged));
    this.loadList();
  },
  loadList: function(additionalData) {
    Target.loadList(additionalData);
  },
  addOne: function(task){
    if (window.track.visiblePage == this) {
      this.render();
    }
  },
  locationChanged: function(location) {
    // TODO update list also when list is not visible
    if (window.track.visiblePage == this) {
      log('location changed - reloading target list');
      this.loadList({lat: location.lat, lon: location.lon});
    }
  },
  clicked: function(e) {
    var el = $(e.target);
    var id = el.attr('data-id');
    if (id) {
      var target = Target.find(id);
      //target.loadDetails();
      Spine.Route.navigate(App.getRoute(target));
    } else if (el.hasClass("create-new")) {
      Spine.Route.navigate(App.getRoute("create_target"));
    }
  },
  /* List search using jQuery-example */
  searchTarget: function() {
    var $lastElement = null;
    var searchTargetInput = $('#search-target-input').val().toLowerCase(); // to record the written text
    $('li').each(function(index){ // go through every li-element
      var $this = $(this);
      if($this.text().toLowerCase().indexOf(searchTargetInput) === -1) { // if targets name doesn't match
        $this.hide(); // hide target
      } else {
        $this.show();
        $(this).addClass('first-visible-child last-visible-child');
        if ($lastElement != null) { // if this customer isn't the first in a list
          $(this).removeClass('first-visible-child');
          $($lastElement).removeClass('last-visible-child'); // to remove roundings from bottom
        }
        $lastElement = this; // record this customer so that next customer is able to remove roundings from bottom
      }
    });
  }
});

/* ownResult
 *=================================================================================================================== */
var ownResult = BaseController.sub({
  events: {
    "fastclick .view-results": "viewResults"
  },
  init: function() {
    BaseController.prototype.init.call(this);
  },
  getTitle: function() {
    return "My Answer";
  },
  getData: function() {
    try {
      var result = Result.find(this.id)
      var data = {result: result.toJSON()};
      data.result.value = data.result.value === 1 ? ":)" : ":(";
      return data;
    } catch(e) {
      return {error: e};
    }
  },
  viewResults: function(e) {
    e.preventDefault();
    var result = Result.find(this.id);
    Spine.Route.navigate(App.getRoute(Target.find(result.target.id)) + "/results");
  }
});

/* TargetDetails
 *====================================================================================================================*/
var TargetDetails = BaseController.sub({
  events: {
    "fastclick .active.balance.item.positive": "savePositiveAnswer",
    "fastclick .active.balance.middle.item.positive": "saveSemiPositiveAnswer",
    "fastclick .active.item.middle.negative": "saveSemiNegativeAnswer",
    "fastclick .active.item.negative": "saveNegativeAnswer",
    "fastclick .send": "sendMessage",
    "fastclick .styled": "focus",
    "fastclick .goToResults": "viewResults"
  },
  init: function() {
    BaseController.prototype.init.call(this);
    Target.bind("create update", this.proxy(this.targetUpdated));
  },
  getTitle: function() {
    return "Target";
  },
  getData: function() {
    var target, error;
    try {
      target = Target.find(this.id);
    } catch (e) { // unknown record
      // try to load record
      Target.loadDetails(this.id, this);
      error = e;
      log(e);
    }
    var name = target.getName();
    var type = target.getQuestionType();
    var items = target.getQuestions();
    var showQuestionComment = target.getShowQuestionComment();

    for (var i in items) {
      var questionItem = items[i];
      questionItem.loadResults();
      console.log(questionItem);
    }
    console.log("items: ");
    console.log(items);
    console.log("============================= RETURN =====================");

    return {name: name, type: type, items: items, showQuestionComment: showQuestionComment, target: target, error: error};
  },
  error: function(reason) {
    if (reason == "notfound") {
      alert('not found');
    }
  },
  targetUpdated: function(target) {
    if (target.id === this.id && window.track.visiblePage == this) {
      this.render();
    }
  },
  answerSaved: function(answer, success) {
    if (success) {
      //this.viewResults();
      //Spine.Route.navigate(App.getRoute(Target.find(this.id)) + "/results");
      // uncomment to show thanks view
      // Spine.Route.navigate(App.getRoute(answer));
    } else {
      log("Answer not saved!");
    }
  },
  saveAnswer: function(value, id) {
    var questionItem = QuestionItem.find(id);
    var result = Result.create({
      questionItem: questionItem,
      value: value,
      location: window.track.location
    });
    result.bind('resultSent', this.proxy(this.answerSaved));
    var user = User.getUser();
    result.post();
  },
  focus: function(e) {
    console.log(e);
    console.log($(e.target).attr("placeholder"));
  },
  saveSomeAnswer: function(e, value) {
    var id = $(e.target).attr('data-id');
    var questionItem = QuestionItem.find(id);
    questionItem.done = true;
    questionItem.save();

    if (Target.find(this.id).getShowQuestionComment() && questionItem.showComment) {
      this.html(this.template(this.getData()));
      this.addFastButtons();
      questionItem.showComment = false;
    } else {
      this.html(this.template(this.getData()));
      this.addFastButtons();
    }
    this.saveAnswer(value, questionItem.id);
    console.log("Tallennettu " + value);
  },
  savePositiveAnswer: function(e) {
    this.saveSomeAnswer(e, 2);
  },
  saveSemiPositiveAnswer: function(e) {
    this.saveSomeAnswer(e, 1);
  },
  saveSemiNegativeAnswer: function(e) {
    this.saveSomeAnswer(e, -1);
  },
  saveNegativeAnswer: function(e) {
    this.saveSomeAnswer(e, -2);
  },
  sendMessage: function(e) {
    var el = $(e.target);
    var id = el.attr('data-id');
    var textAreaElements = document.getElementsByClassName("styled");
    for (var i = 0; i < textAreaElements.length; i++) {
      if (id == textAreaElements[i].getAttribute('data-id')) {
        var text = textAreaElements[i].value;
        var questionItem = QuestionItem.find(id);
        var resultItem = Result.create({questionItem: questionItem, textComment: text, location: window.track.location});
//        resultItem.bind('resultSent', this.proxy(this.answerSaved));
        var user = User.getUser();
        resultItem.post();
        questionItem.done = true;
        questionItem.showComment = false;
        questionItem.save();
        this.html(this.template(this.getData()));
        this.addFastButtons();
      }
    }
  },
  viewResults: function(e) {
    var el = $(e.target);
    var id = el.attr('data-id');
    //var route = App.getRoute("result/" + QuestionItem.find(id).id_);
    var route = "result/" + QuestionItem.find(id).questionId;
    console.log(route);
    //Spine.Route.navigate(route);
  }
});

/* TargetCreate
 *=================================================================================================================== */
var TargetCreate = BaseController.sub({
  events: {
    "submit #create-target-form": "saveTarget"
  },
  init: function() {
    BaseController.prototype.init.call(this);
  },
  getTitle: function() {
    return "Create Target";
  },
  targetSavedToServer: function(target, success) {
    log(target.name + (success ? '' : ' _NOT_') + ' saved to server');
    if (success) {
      Spine.Route.navigate(App.getRoute(target));
    } else {
      alert('For some reason, target was not saved to server. Please try again later.');
      // signal failure to the user
    }
  },
  saveTarget: function(e) {
    e.preventDefault();
    var target = Target.fromForm($(e.target));
    target.location = window.track.location;
    target.bind("saveToServer", this.targetSavedToServer);
    target.saveToServer();
  }
});

/* TargetResults
 *=================================================================================================================== */
var TargetResults = BaseController.sub({
  init: function() {
    BaseController.prototype.init.call(this);

    // this is binded to all events to avoid the unbind-old/bind-new
    // hassle when viewing another target
    Target.bind("create update", this.proxy(this.targetUpdated));
  },
  targetUpdated: function(target) {
    if (target.id === this.id && window.track.visiblePage == this) {
      this.render();
    }
  },
  getTitle: function() {
    return "Question Results";
  },
  getData: function() {
    var data = {};
    try {
      data.target = Target.find(this.id).toJSON();

      // preprocess alltime results
      var alltime = data.target.results.alltime;
      if (alltime.pos == 0 && alltime.neg == 0) {
        alltime.zerozero = true;
      }

      // preprocess "now" results
      var now = data.target.results.now

      //now.pos = 4; now.neg = 7;
      //now.trend = -2;

      if (now.pos == 0 && now.neg == 0) {
        now.zerozero = true;
      }
      now.trendPos = Math.abs(Math.max(0, now.trend));
      now.trendNeg = Math.abs(Math.min(0, now.trend));

    } catch (e) {
      Target.loadDetails(this.id, this);
      data.error = e;
    }
    return data;
  },
  render: function() {
    BaseController.prototype.render.call(this);
  }
});

/* Leaderboard
 *=================================================================================================================== */
var Leaderboard = BaseController.sub({
  init: function() {
    BaseController.prototype.init.call(this);

    LeaderboardEntry.bind('create update', this.proxy(this.entryAdded));

    // update the list
    //LeaderboardEntry.load();
  },
  show: function() {
    // update the list
    LeaderboardEntry.load();
    BaseController.prototype.show.call(this);
  },
  entryAdded: function() {
    if (window.track.visiblePage == this) {
      this.render();
    }
  },
  getData: function() {
    // sort data and add positions accordingly
    var entries = _.sortBy(LeaderboardEntry.all(), function(item) {
      return -1*item.points;
    });
    for (var i in entries) {
      entries[i].position = parseInt(i) + 1;
    }
    return {entries: entries};
  }
});

/* BackButton
 *=================================================================================================================== */
var BackButton = BaseController.sub({
  events: {
    "fastclick .back-button": "backClicked",
    "fastclick .home-button": "homeClicked"
  },
  init: function() {
    BaseController.prototype.init.call(this);
    Spine.bind('page:change', this.proxy(this.render));
    Spine.bind('logout', this.proxy(this.render));
  },
  getData: function() {
    var showPrev = this.app.getPreviousPage() !== undefined && this.app.loginOk();
    //var showPrev = true; // so that we are able to go customer page !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    var showHome = false;

    if (this.app.visiblePage === this.app.pages['customerList']) {
      showHome = false;
      showPrev = false;
    }
    if (this.app.visiblePage === this.app.pages['targetList']) {
      showHome = true;
      showPrev = false;
    }
    return {previous: showPrev, home: showHome};
  },
  backClicked: function() {
    if (window.history.length > 0 && this.app.visiblePage !== this.app.pages['targetList'] && this.app.visiblePage !== this.app.pages['customerList']) {
      //if (window.history.length > 0) {

      window.history.back();
    }
  },
  homeClicked: function() {
    if (this.app.visiblePage === this.app.pages['targetList']) {
      Spine.Route.navigate('!/customer/');
    }
  }
});

/* LoginScreen
 *=================================================================================================================== */
var LoginScreen = BaseController.sub({
  events: {
    "fastclick .login-button": "loginUser",
    "fastclick .no-login": "setNoLogin",
    "fastclick #view-leaderboard": "viewLeaderboard"
  },
  init: function() {
    BaseController.prototype.init.call(this);
    User.bind("create update", this.proxy(this.loginUpdated));
    Spine.bind("logout", this.proxy(this.loggedOut));
  },
  loginUpdated: function() {
    if (window.track.visiblePage == this) {
      this.render();
    }
  },
  loggedOut: function() {
    this.show();
  },
  getData: function() {
    return User.last() || {};
  },
  loginUser: function() {
    var opts = {scope:'email'};
    if (this.useRedirectURI()) {
      opts.redirect_uri = document.location.href;
    }
    FB.login(function(response) { }, opts);
  },
  useRedirectURI: function() {
    var ua = navigator.userAgent;

    // no iphone, ipod or ipad => no redirect URI
    if (ua.indexOf('iPhone') == -1 && ua.indexOf('iPad') == -1 && ua.indexOf('iPod') == -1) {
      return false;
    }

    // ua contains safari => not homescreen app => no redirect URI
    if (ua.indexOf('Safari') > -1) {
      return false;
    }

    // ios but not safari => add redirect URI
    return true;

  },
  setNoLogin: function() {
    window.track.noLogin = true;
    Spine.Route.navigate('/');
  },
  viewLeaderboard: function(e) {
    Spine.Route.navigate('!/leaderboard');
  }
});