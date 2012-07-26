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
    return {items: Customer.findAllByAttribute("saved", true)};
  },
  init: function() {
    BaseController.prototype.init.call(this);
    // load list (without location data) even when no location gotten
    this.loadList();
    Customer.bind("create", this.proxy(this.addOne));
    //Spine.bind('location:changed', this.proxy(this.locationChanged));
  },
  loadList: function(additionalData) {
    Customer.loadList(additionalData);
  },
  locationChanged: function(location) {
    // TODO update list also when list is not visible
    if (window.track.visiblePage == this) {
      log('location changed - reloading target list');
      this.loadList({lat: location.lat, lon: location.lon});
    }
  },
  addOne: function(task){

    if (window.track.visiblePage == this) {
      this.render();
    }
  },
  clickedCustomer: function(e) {
    var el = $(e.target);
    var id = el.attr('data-id');
    if (id) {
      var customer = Customer.find(id);
      //console.log(customer);
      //Target.loadList(customer.customerId);
      Spine.Route.navigate(App.getRoute(customer));
    }
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
    console.log(window.location.pathname);
    console.log(document.URL);

    if (this.id == null) {
      var items = Target.findAllByAttribute("saved", true);
    } else {
      var items = Target.findAllByAttribute("customerId", this.id);
    }
    return {items: items};
  },
  init: function() {
    BaseController.prototype.init.call(this);
    Spine.bind('location:changed', this.proxy(this.locationChanged));

    // load list (without location data) even when no location gotten
    Spine.bind('location:error', this.proxy(this.locationChanged));
    this.loadList();
    Target.bind("create", this.proxy(this.addOne));

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
    console.log("==========================================");
    console.log(this.id);
    if (Target.findAllByAttribute("saved", true).length == 0) {
      console.log("ladataan");
    }
    console.log(Target.findAllByAttribute("saved", true));

    var target, error;
    try {
      var list = Target.findAllByAttribute("targetId",this.id);
      target = list[0];
    } catch (e) { // unknown record
      // try to load record
      Target.loadList(this.id);
      error = e;
      console.log(e + "VIRHE");
    }
    var name = target.getName();
    var type = target.getQuestionType();
    var items = target.getQuestions();
    var user = User.getUser();
    if (user.getPoints() == null) {
      user.points = 0;
      user.save();
    }
    var showQuestionComment = target.getShowQuestionComment();
    return {name: name, points: user.getPoints(), type: type, items: items, showQuestionComment: showQuestionComment, target: target, error: error};
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
    var result = Result.create({
      questionItem: QuestionItem.find(id),
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
  loadAnswer: function(e, value) {
    var user = User.getUser();
    user.points += 1;
    user.save();
    var id = $(e.target).attr('data-id');
    var questionItem = QuestionItem.find(id);
    questionItem.done = true;
    questionItem.loadResults(questionItem.id);
    questionItem.save();
    var target;
    var list = Target.findAllByAttribute("saved", true);
    for (var i in list) {
      for (var j in list[i].questions) {
        if (list[i].questions[j].questionId == questionItem.questionId) {
          target = list[i];
        }
      }
    }

    if (target.getShowQuestionComment() && questionItem.showComment) {
      this.html(this.template(this.getData()));
      this.addFastButtons();
      questionItem.showComment = false;
    } else {
      this.html(this.template(this.getData()));
      this.addFastButtons();
    }
    this.saveAnswer(value, questionItem.id);
  },
  savePositiveAnswer: function(e) {
    this.loadAnswer(e, 2);
  },
  saveSemiPositiveAnswer: function(e) {
    this.loadAnswer(e, 1);
  },
  saveSemiNegativeAnswer: function(e) {
    this.loadAnswer(e, -1);
  },
  saveNegativeAnswer: function(e) {
    this.loadAnswer(e, -2);
  },
  sendMessage: function(e) {
    var user = User.getUser();
    user.points += 3;
    user.save();
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
    console.log(el);
    console.log(id);
    var questionItem = QuestionItem.find(id);
    var route = "!/questions/" + questionItem.questionId + "/results";
    Spine.Route.navigate(route);

    if (questionItem.showResults) {
      var route = App.getRoute(questionItem) + "/results";
      Spine.Route.navigate(route);
    } else {
      questionItem.showResults = true;
      questionItem.save();
    }
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

/* QuestionResults
 *=================================================================================================================== */
var QuestionResults = BaseController.sub({
  init: function() {
    BaseController.prototype.init.call(this);

    // this is binded to all events to avoid the unbind-old/bind-new
    // hassle when viewing another target
    QuestionItem.bind("create update", this.proxy(this.questionUpdated));
  },
  questionUpdated: function(question) {
    if (question.id === this.id && window.track.visiblePage == this) {
      this.render();
    }
  },
  getTitle: function() {
    return "Question Results";
  },
  getData: function() {
    var data = {};
    var questionItemList = QuestionItem.findAllByAttribute('questionId', this.id);
    var questionItem;
    for (var i in questionItemList) {
      if (questionItemList[i].results != null) {
        questionItem = questionItemList[i];
      }
    }
    var targetList = Target.findAllByAttribute("saved",true);
    for (var i in targetList) {
      for (var j in targetList[i].questions) {
        if (targetList[i].questions[j].questionId == questionItem.questionId) {
          data.name = targetList[i].name;
          continue;
        }
      }
    }

    data.question = questionItem.name;
    try {
      //data.target = Target.find(this.id).toJSON();
      data.alltime = questionItem.results.alltime;
      // preprocess alltime results
      //var questionItem.alltime = data.question.results.alltime;
      if (data.alltime.pos == 0 && data.alltime.neg == 0) {
        data.alltime.zerozero = true;
      }
      data.now = questionItem.results.now;
      if (data.now.pos == 0 && data.now.neg == 0) {
        data.now.zerozero = true;
      }
      data.now.trendPos = Math.abs(Math.max(0, data.now.trend));
      data.now.trendNeg = Math.abs(Math.min(0, data.now.trend));
    } catch (e) {
      //Target.loadDetails(this.id, this);
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
    if (this.app.visiblePage === this.app.pages['loginScreen'] && showPrev == false) {
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
    Spine.Route.navigate('!/customers/');
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