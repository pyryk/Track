var App = Spine.Controller.sub({
  pages: {},
  visiblePage: undefined,
  init: function() {
    this.routes({
      "!/login/": function(params) {
        this.renderView('loginScreen', LoginScreen);
      },
      "!/targets/": function(params) {
        this.renderView('targetList', TargetsList);
      },
      "!/targets/create": function(params) {
        this.renderView('targetCreate', TargetCreate);
      },
      "!/targets/:id": function(params) {
        this.renderView('targetDetails', TargetDetails, params.id);
      },
      "!/results/:id": function(params) {
        this.renderView('ownResult', ownResult, params.id);
      },
      "!/targets/:id/results": function(params) {
        this.renderView('targetResults', TargetResults, params.id);
      },
      // default route
      "*others": function(params) {
        log("Invalid route ", params.match.input, " - redirecting to default");
        Spine.Route.navigate("!/targets/");
      }
    });
    
    Spine.Route.setup();
    
    
    // enable back button
    new BackButton({
      el: $('#back-button'),
      template: $('#template-backButton'),
      app: this,
    }).render();
    
    // enable logins
    if (window.trackConfig && window.trackConfig.enableAuth) {
      this.addLogin();
    }
    
    // update location data once a minute...
    this.updateLocation(); // ... and at once
    window.setInterval(this.proxy(this.updateLocation), 60000);
    
  },
  renderView: function(name, className, id) {
    if (name !== "loginScreen" && !this.loginOk()) {
      this.redirect = Spine.Route.getFragment();
      Spine.Route.navigate("!/login/");
    } else {
      // create controller if it doesnt already exist
      if (!this.pages[name]) {
        var tmpl = $('#template-' + name);
        log("creating view " + name, "with template", tmpl);
        this.pages[name] = new className({
          el: $("#main"),
          template: tmpl
        });
      }
    
      log("rendering view " + name);
      this.pages[name].id = id; // set id if needed
      this.pages[name].render();
      this.visiblePage = this.pages[name];
    
      // add page to the page stack:
      if (this.pageStack[this.pageStack.length-1] !== this.pages[name] &&
        this.pageStack[this.pageStack.length-2] !== this.pages[name]) {
        this.pageStack.push(this.pages[name]);
      }
    }
    Spine.trigger('page:change');
  },
  addLogin: function() {
    var fb = $('<div id="fb-root"></div>');
    $('body').append(fb);
    
    window.fbAsyncInit = function() {
      FB.init({
        appId      : '167103313410896', // App ID
        channelUrl : '//localhost/channel.html', // Channel File
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
      });
      User.create({logged: false});

      FB.Event.subscribe('auth.statusChange', handleStatusChange);
    };
    // Load the SDK Asynchronously
    (function(d){
       var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement('script'); js.id = id; js.async = true;
       js.src = "//connect.facebook.net/en_US/all.js";
       ref.parentNode.insertBefore(js, ref);
     }(document));
     
     var handleStatusChange = this.proxy(function(response) {
       //document.body.className = response.authResponse ? 'connected' : 'not_connected';
       log("FB login response: ", response);
       if (response.authResponse) {
         var user = User.getUser();
         user.token = response.authResponse.accessToken;
         user.logged = true;
         user.save();
         
         FB.api('/me', function(response) {
           user.name = response.username ? response.username : response.id;
           user.email = response.email;
           user.provider = "facebook";
           user.save();
         });
         
         if (this.redirect) {
           Spine.Route.navigate(this.redirect); 
         }
       }
     });
  },
  updateLocation: function() {
    navigator.geolocation.getCurrentPosition(this.proxy(function(position) {
      this.location.lat = position.coords.latitude;
      this.location.lon = position.coords.longitude;
      this.location.timestamp = position.timestamp;
      
      // update list after location change
      Spine.trigger('location:changed', this.location);
    }), this.proxy(function(error) {
      log("Could not get user location");
      
      // if location is undefined, trigger error, otherwise stay silent
      if (!this.location.lat && !this.location.long) {
        Spine.trigger('location:error', this.location);
      }
    }), {timeout:50000});
  },
  location: {lat: undefined, lon: undefined},
  getAdditionalData: function() {
    var data = {};
    data.location = this.location;
  },
  pageStack: [],
  getPreviousPage: function() {
    var current = this.visiblePage;

    // some hard-coded bits of back button logic
    switch(current) {
      case this.pages['targetCreate']:
      case this.pages['targetDetails']:
        return this.pages['targetList'];
      case this.pages['ownResult']:
      case this.pages['targetResults']:
        return this.pages['targetDetails'];
      default: 
        return undefined;
    }
  },
  // previous pages are always target details or list page. modify if this changes
  goToPreviousPage: function() {
    /*var popped = this.pageStack.pop();
    history.back();*/
    var current = this.visiblePage;
    
    var prev = this.getPreviousPage();
    
    if (!prev) {
      return;
    }
    
    if (prev.id) {
      Spine.Route.navigate(App.getRoute(Target.find(prev.id)))
    } else {
      Spine.Route.navigate("!/targets/");
    }
  },
  loginOk: function() {
    return !(window.trackConfig && window.trackConfig.enableAuth &&
           !User.getUser().logged)
  },
});

if (window.trackConfig && window.trackConfig.serverURL) {
  App.serverURL = window.trackConfig.serverURL
} else{
 App.serverURL = "http://mkos.futupeople.com/track/"; 
}
 
//App.serverURL = "http://localhost:9999/";

/**
 * Return a route fragment to a specific domain object (target etc.)
 *
 */
App.getRoute = function(obj) {
  // special cases first
  if (obj === "create_target") {
    return "!/targets/create";
  }
  
  return "!/" + obj.getResourceName() + "/" + obj.id
}

//TODO url resolver?

App.fastClicksEnabled = function() {
  return true;
  var disable = [
    {browser: "Safari", OS: "iPhone/iPod", version: /OS 4_(.)+/}
  ];

  //BrowserDetect = {browser: "Safari", OS: "iPhone/iPod", version: "4_3_3"};
  for (var i in disable) {
    if (BrowserDetect.browser === disable[i].browser &&
        BrowserDetect.OS === disable[i].OS/* &&
        (BrowserDetect.version + "").match(disable[i].version)*/ &&
        navigator.appVersion.match(disable[i].version)) {
          
      return false;
    }
  }
  
  return true;
}

Handlebars.registerHelper('trend', function(value) {
  console.log(value);
  var str = '';
  for (var i=0; i<value; i++) {
    str += '<div class="trend"></div>';  
  }
  return new Handlebars.SafeString(str);
});