/* Basecontroller
 *=================================================================================================================== */
var BaseController = Spine.Controller.sub({
  init: function() {
    this.rawTemplate = this.template;
    this.titlebar = $('#main-title');
    this.header = $('#header');
    this.button_one = $('#back-button');
    this.button_two = $('#account-button');
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
      if (data.title) {
        this.titlebar.text(data.title);
      }
      if (data.customizationClass) {
        this.header.removeClass();
        this.button_one.removeClass();
        this.button_two.removeClass();
        this.header.addClass(data.customizationClass);
        this.button_one.addClass(data.customizationClass + "-button");
        this.button_two.addClass(data.customizationClass + "-button");
      }
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
    "fastclick #customer-list li": "clickedCustomer",
    "keyup #search-customer-input": "searchCustomer"
  },
  getData: function() {
    var items = Customer.findAllByAttribute("saved", true);
    return {items: items, title: 'tracktive', customizationClass: 'tracktive'};
  },
  init: function() {
    BaseController.prototype.init.call(this);
    this.loadList();
    Customer.bind("create", this.proxy(this.addOne));
    Spine.bind('location:changed', this.proxy(this.locationChanged));
  },
  loadList: function(additionalData) {
    Customer.loadList(additionalData);
  },
  locationChanged: function(location) {
    // TODO update list also when list is not visible
    if (window.track.visiblePage == this) {
      this.loadList({lat: location.lat, lon: location.lon});
    }
  },
  addOne: function(task){
    if (window.track.visiblePage == this) {
      this.render();
    }
  },
  clickedCustomer: function(e) {
    var id = $(e.target).attr('data-id');
    if (id) {
      Customer.loadCustomer(id);
      Spine.Route.navigate("!/customers/" + id);
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
  init: function() {
    BaseController.prototype.init.call(this);
    Spine.bind('location:changed', this.proxy(this.locationChanged));
    Spine.bind('location:error', this.proxy(this.locationChanged));
    Customer.bind("create update", this.proxy(this.customerUpdated));
  },
  getData: function() {
    var customer, customClass, title, items;
    try {
      customer = Customer.find(this.id);
      customClass = customer.name.toLowerCase().replace(/'/g,"");
      title = customer.name;
      items = customer.targets;
    } catch (e) {
      this.loadList();
    }
    return {items: items, title: title, customizationClass: customClass};
  },
  customerUpdated: function(customer) {
    if (customer.id == this.id && window.track.visiblePage == this) {
      this.render();
    }
  },
  loadList: function(additionalData) {
    Customer.loadCustomer(this.id, additionalData);
  },
  locationChanged: function(location) {
    if (window.track.visiblePage == this) {
      this.loadList({lat: location.lat, lon: location.lon});
    }
  },
  clicked: function(e) {
    var id = $(e.target).attr('data-id');
    Target.loadDetails(id);
    Spine.Route.navigate("!/targets/" + id);

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
    "fastclick .active.item.most.positive": "savePositiveAnswer",
    "fastclick .active.item.middle.positive": "saveSemiPositiveAnswer",
    "fastclick .active.item.middle.negative": "saveSemiNegativeAnswer",
    "fastclick .active.item.most.negative": "saveNegativeAnswer",
    "fastclick .send": "sendMessage",
    "fastclick .goToResults": "viewResults"
  },
  init: function() {
    BaseController.prototype.init.call(this);
    Target.bind("create update", this.proxy(this.targetUpdated));
    User.bind("update", this.proxy(this.userUpdated));
  },
  getData: function() {
    var target, error;
    var customerName, customClass, name, type, items, showQuestionComment = null;
    try {
      target = Target.find(this.id);
      name = target.getName();
      type = target.getQuestionType();
      items = target.getQuestions();
      customerName = target.getCustomerName();
      customClass = customerName.toLowerCase().replace(/'/g,"");
      showQuestionComment = target.getShowQuestionComment();
    } catch (e) {
      Target.loadDetails(this.id);
      error = e;
    }
    return {name: name, points: User.getUser().points, type: type, items: items, showQuestionComment: showQuestionComment, target: target, error: error, title: customerName, customizationClass: customClass};
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
  userUpdated: function() {
    if (window.track.visiblePage == this) {
      var user = User.getUser();
      if (!user.points) user.points = 0;
      console.log(user.points);
      $(".target-points-font").text(user.points);
    }
  },
  savePositiveAnswer: function(e) {this.loadAnswer(e, 2);},
  saveSemiPositiveAnswer: function(e) {this.loadAnswer(e, 1);},
  saveSemiNegativeAnswer: function(e) {this.loadAnswer(e, -1);},
  saveNegativeAnswer: function(e) {this.loadAnswer(e, -2);},
  sendMessage: function(e) {this.loadAnswer(e, 0);},
  loadAnswer: function(e, value) {
    var id = $(e.target).attr('data-id');
    try {var questionItem = QuestionItem.find(id);}
    catch(e) {return console.log(e);}
    questionItem.done = true;
    if (value !== 0) {
      User.loadPoints(1);
      QuestionItem.loadResults(questionItem.id, true, questionItem);
      var resultItem = Result.create({questionItem: questionItem, value: value, location: window.track.location});
      resultItem.post();
    } else {
      User.loadPoints(2);
      var textAreaElements = document.getElementsByClassName('styled');
      for (var i = 0; i < textAreaElements.length; i++) {
        if (id == textAreaElements[i].getAttribute('data-id')) {
          var resultItem = Result.create({questionItem: questionItem, textComment: textAreaElements[i].value, location: window.track.location});
          resultItem.put();
          questionItem.showComment = false;
        }
      }
    }
    questionItem.save();
    this.render();
  },
  viewResults: function(e) {
    var id = $(e.target).attr('data-id');
    QuestionItem.loadResults(id, false, null);
    Spine.Route.navigate("!/questions/" + id + "/results");
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
  targetSavedToServer: function(target, success) {
    if (success) {
    } else {
      alert('For some reason, target was not saved to server. Please try again later.');
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
    // hassle when viewing another target
    QuestionItem.bind("create update", this.proxy(this.questionUpdated));
    User.bind("update", this.proxy(this.userUpdated));
  },
  questionUpdated: function(question) {
    if (question.id === this.id && window.track.visiblePage == this) {
      this.render();
    }
  },
  userUpdated: function() {
    console.log("userUpdated??");
    console.log(window.track.visiblePage == this);
    if (window.track.visiblePage == this) {
      var user = User.getUser();
      if (!user.points) user.points = 0;
      console.log(user.points);
      $(".target-points-font").text(user.points);
    }
  },
  getData: function() {
    var data = {};
    var questionItem = null;
    try {
      questionItem = QuestionItem.find(this.id);
      data.name = questionItem.targetName;
      data.title = questionItem.customerName;
      data.customizationClass = data.title.toLowerCase().replace(/'/g,"");
      data.question = questionItem.name;
      data.alltime = questionItem.results.alltime;
      data.now = questionItem.results.now;
      data.points = User.getUser().points;
      if (data.alltime.pos == 0 && data.alltime.neg == 0) data.alltime.zerozero = true;
      if (data.now.pos == 0 && data.now.neg == 0) data.now.zerozero = true;
      //data.now.trendPos = Math.abs(Math.max(0, data.now.trend));
      //data.now.trendNeg = Math.abs(Math.min(0, data.now.trend));
    } catch(e) {
      QuestionItem.loadResults(this.id, false, null);
    }
    User.loadPoints(0);
    return data;
  }
});

/* Leaderboard
 *=================================================================================================================== */
var Leaderboard = BaseController.sub({
  init: function() {
    BaseController.prototype.init.call(this);
    LeaderboardEntry.bind('create update', this.proxy(this.entryAdded));
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
    return {entries: entries, customizationClass: "tracktive", title: "tracktive"};
  }
});

/* BackButton
 *=================================================================================================================== */
var BackButton = BaseController.sub({
  events: {
    "click .back-button": "backClicked",
    "click .home-button": "homeClicked"
  },
  init: function() {
    BaseController.prototype.init.call(this);
    Spine.bind('page:change', this.proxy(this.render));
    Spine.bind('logout', this.proxy(this.render));
  },
  getData: function() {
    var showPrev = this.app.getPreviousPage() !== undefined && this.app.loginOk();
    var showHome = false;
    if (this.app.visiblePage === this.app.pages['targetList'] || this.app.visiblePage === this.app.pages['targetDetails']
      || this.app.visiblePage === this.app.pages['questionResults'] || this.app.visiblePage === this.app.pages['leaderboard']) {
      showPrev = true;
    }
    if (this.app.visiblePage === this.app.pages['targetList'] || (this.app.visiblePage === this.app.pages['loginScreen'] && showPrev == false)
      || (this.app.visiblePage === this.app.pages['loginScreen'] && showPrev == false)) {
      showHome = true;
      showPrev = false;
    }
    if (this.app.visiblePage === this.app.pages['customerList']) {
      showHome = false;
      showPrev = false;
    }
    return {previous: showPrev, home: showHome};
  },
  backClicked: function() {
    if (window.history.length > 0 && this.app.visiblePage !== this.app.pages['targetList'] && this.app.visiblePage !== this.app.pages['customerList']) {
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
    var data = User.last() || {};
    data.customizationClass = data.title = "tracktive";
    return data;
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