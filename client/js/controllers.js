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
    //this.addPseudoActiveSupport();
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
            log("Adding a fast button listener");
            new MBP.fastButton(btn, this.proxy(this[this.events[i]]));
          }));
        } else {
          log("Adding a traditional click listener");
          buttons.bind("click", this.proxy(this[this.events[i]]));
        }
      }
    }
  },
  // TODO remove if not needed
  addPseudoActiveSupport: function() {
    if (navigator.userAgent.toLowerCase().indexOf("android 2") > -1) {
     $(".active-button")
     .bind("touchstart", function () {
         $(this).addClass("fake-active");
     })
     .bind("touchend", function() {
         $(this).removeClass("fake-active");
     })
     .bind("touchcancel", function() {
       $(this).removeClass("fake-active");
      });
    }
  }
});

/**
 * A controller for the target item list
 *
 */
var TargetsList = BaseController.sub({
  elements: {
    ".targets": "targets"  
  },
  events: {
    "fastclick #target-list li": "clicked"
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
      target.loadDetails();
      Spine.Route.navigate(App.getRoute(target));
    } else if (el.hasClass("create-new")) {
      Spine.Route.navigate(App.getRoute("create_target"));
    }
  }
});

var ownResult = BaseController.sub({
  events: {
    "fastclick .view-results": "viewResults",
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

var TargetDetails = BaseController.sub({
  events: {
    "fastclick .active.answer.positive": "savePositiveAnswer",
    "fastclick .active.answer.negative": "saveNegativeAnswer",
    "fastclick .view-results": "viewResults"
  },
  init: function() {
    BaseController.prototype.init.call(this);
    
    // this is binded to all events to avoid the unbind-old/bind-new
    // hassle when viewing another target
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
    return {target: target, error: error};
  },
  render: function() {
    BaseController.prototype.render.call(this);
    
    //console.log($(this.el).find('.view-results').length);
    /*this.el.find('.view-results').bind("click", this.proxy(function(e) {
      console.log('view results clicked');
      this.viewResults(e);
    }));*/
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
      this.viewResults();
      // uncomment to show thanks view
      // Spine.Route.navigate(App.getRoute(answer));
    } else {
      log("Answer not saved!");
    }
  },
  saveAnswer: function(value) {
    log("Saving answer", value);
    var target = Target.find(this.id);
    var result = Result.create({
      target: target, 
      value: value, 
      location: window.track.location
    });
    result.bind('resultSent', this.proxy(this.answerSaved));
    var user = User.getUser();
    result.post();
  },
  savePositiveAnswer: function() {
    this.saveAnswer(1);
  },
  saveNegativeAnswer: function() {
    this.saveAnswer(0);
  },
  viewResults: function(e) {
    var route = App.getRoute(Target.find(this.id)) + "/results";
    Spine.Route.navigate(route);
  }
});

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
    return "Target Results";
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
      //now.trend = 1;
      
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
  displayChart: function(el) {
    //try {
      try {
        var target = Target.find(this.id);
      } catch(e) {
        log(e);
        return;
      }
    
      var now = new Date();
      
      // setup the chart properties
      
      var positives = {
        data: [],
        bars: {show: true},
      }
      var negatives = {
        data: [],
        bars: {show: true},
      }
      var options = {
        grid: {
          autoHilight: true,
          clickable: true,
          backgroundColor: {colors: ["#fff", "#ddd"]},
          markings: {xaxis: {from: -1, to: 1}, color: "#ff0000"}
        },
        bars: {
          barWidth: 900000, // ms, 15*60*1000
        },
        xaxis: {
          mode: "time",
          ticks: 4,
          tickLength: 0,
          min: now.getTime()
        },
        yaxis: {
          ticks: 1,
          tickDecimals: 0
        },
        colors: ["#00ff00","#ff0000"]
      }
      
      var maxTime = 0;
      for (var i in target.results.history) {
        var chunk = target.results.history[i];
        
        var date = new Date(chunk.start);
        
        // if too far (3h+) in the past
        if (date.getTime() + 3*60*60*1000 < now.getTime()) {
          continue;
        }
        
        date.setUTCHours(date.getHours()); // workaround for flot showing only UTC
        var millis = date.getTime();
        
        if (maxTime < millis) {
          maxTime = millis;
        }
        
        negatives.data.push([millis, -1*chunk.neg]);
        positives.data.push([millis, chunk.pos]);
      }

      options.xaxis.min = maxTime - 2*60*60*1000;
      
      $.plot(el, [ positives, negatives ], options);
      
      el.bind("plotclick", function(event, pos, item) {
        if (!item) {
          $('#tooltip').remove();
          return; // no item selected
        }
        var pos = {left: pos.pageX - el.offset().left, top: pos.pageY - el.offset().top}
        var series = item.seriesIndex === 0 ? positives : negatives;
        var values = series.data[item.dataIndex];
        
        el.trackTooltip(series === positives ? values[1] : -1 * values[1], pos, item);
      });
    //} catch (e) {
    //  console.error(e);
    //}
  },
  render: function() {
    BaseController.prototype.render.call(this);
    //this.displayChart(this.el.find(".graph"));
  }
});

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
    log('leaderboard entry added');
    
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

var BackButton = BaseController.sub({
  events: {
    "fastclick .login-button": "clicked"
  },
  init: function() {
    BaseController.prototype.init.call(this);
    Spine.bind('page:change', this.proxy(this.render));
  },
  getData: function() {
    return {previous: this.app.getPreviousPage() !== undefined};
  },
  clicked: function() {
    this.app.goToPreviousPage();
  }
});

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
    FB.login(function(response) { }, {scope:'email'});     
  }, 
  setNoLogin: function() {
    window.track.noLogin = true;
    Spine.Route.navigate('/');
  },
  viewLeaderboard: function(e) {
    Spine.Route.navigate('!/leaderboard');
  }
});