var App = Spine.Controller.sub({
  pages: {},
  visiblePage: undefined,
  init: function() {
    // load the user from cookies, if there is one
    User.getUser().loadFromCookies();

    this.routes({
      "!/login/": function(params) {
        this.renderView('loginScreen', LoginScreen);
      },
      "!/customers/": function(params) {
        this.renderView('customerList', CustomersList);
      },
      "!/customers/:id": function(params) {
        this.renderView('targetList', TargetsList, params.id);
      },
      "!/targets/create": function(params) {
        this.renderView('targetCreate', TargetCreate);
      },
      "!/targets/:id": function(params) {
        console.log(params.id);
        this.renderView('targetDetails', TargetDetails, params.id);
      },
      "!/results/:id": function(params) {
        this.renderView('ownResult', ownResult, params.id);
      },
      "!/questions/:id/results": function(params) {
        this.renderView('questionResults', QuestionResults, params.id);
      },
      "!/leaderboard": function(params) {
        this.renderView('leaderboard', Leaderboard);
      },
      // default route
      "*others": function(params) {
        log("Invalid route ", params.match.input, " - redirecting to default");
        Spine.Route.navigate("!/customers/");
      }
    });

    Spine.Route.setup();

    // enable back button
    new BackButton({
      el: $('#back-button'),
      template: $('#template-backButton'),
      app: this
    }).render();



    // enable logins
    if (window.trackConfig && window.trackConfig.enableAuth) {
      this.addLogin();
    }
    this.addLogin();
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
        this.pages[name] = new className({
          el: $("#main"),
          template: tmpl
        });
      }

      this.pages[name].id = id; // set id if needed
      this.pages[name].show();
      this.visiblePage = this.pages[name];

      // add page to the page stack:
      // page should not be added, if
      // a) it is the current page (lenght-1)
      // b) is is the previous page (length-2)
      if (this.pageStack[this.pageStack.length-1] !== this.pages[name] &&
        this.pageStack[this.pageStack.length-2] !== this.pages[name]) {
        this.pageStack.push(this.pages[name]);
      }
    }
    Spine.trigger('page:change');
  },
  loggedOut: function() {
    log('logged out - displaying login page');
    Spine.Route.navigate('!/login');
  },
  addLogin: function() {
    var fb = $('<div id="fb-root"></div>');
    $('body').append(fb);
    Spine.bind('logout', this.proxy(this.loggedOut));
    window.fbAsyncInit = function() {
      FB.init({
        appId      : '167103313410896', // App ID
        channelUrl : '//localhost/channel.html', // Channel File
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
      });
      User.getUser();
      // check login status; may conflict with cookies (if e.g. logged out from fb elsewhere)
      FB.getLoginStatus(function(response) {
        if (!response.authResponse) {
          var user = User.getUser();
          user.destroyCookies();
          user.destroy();
          Spine.trigger("logout");
        }
      });

      FB.Event.subscribe('auth.statusChange', handleStatusChange);
    };
    // Load the SDK Asynchronously
    (function(d){
      var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement('script'); js.id = id; js.async = true;
      js.src = "http://connect.facebook.net/en_US/all.js";
      //js.src = "js/facebook.js";
      ref.parentNode.insertBefore(js, ref);
    }(document));

    var handleStatusChange = this.proxy(function(response) {
      //document.body.className = response.authResponse ? 'connected' : 'not_connected';
      log("FB login response: ", response);
      if (response.authResponse) {
        var user = User.getUser();
        user.token = response.authResponse.accessToken;
        user.logged = true;
        user.name = response.authResponse.userID;
        //user.expires = 1;
        user.provider = "facebook";
        user.save();

        // get long-term access token for user
        // see https://developers.facebook.com/roadmap/offline-access-removal/
        // the token expires in 60 days
        $.ajax({
          url: "https://graph.facebook.com/oauth/access_token?client_id=167103313410896&client_secret=c11d366378f47c931da7770583617ece&grant_type=fb_exchange_token&fb_exchange_token="+user.token,
          success: function(data) {
            // parse params (in url param format)
            var parts = data.split("&");
            var params = {};
            for (var i in parts) {
              var param = parts[i].split("=");
              params[param[0]] = param[1];
            }

            // update the user attributes
            user.token = params['access_token'];
            user.expires = params['expires'];
            var expires;
            try {
              expires = Math.floor(parseInt(params['expires'])/86400) // seconds to days
            } catch(e) { // numberformatexception
              expires = 59;
            }
            // persist the token and userid in cookies
            user.saveCookies(expires);
          },
          error: function() {
            log('Error getting long-term FB token. Using short-term one instead.');
          }
        });

        /*FB.api('/me', function(response) {
         user.name = response.id;
         user.email = response.email;
         user.provider = "facebook";
         user.save();
         });*/

        if (this.redirect) {
          Spine.Route.navigate(this.redirect);
        } else {
          //Spine.Route.navigate("!/");
        }
      }
      else {
        var user = User.getUser();
        user.destroyCookies();
        user.destroy();
        Spine.trigger("logout");
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
      case this.pages['questionResults']:
        return this.pages['targetDetails'];
      case this.pages['loginScreen']:
        return this.pages['targetList'];
      case this.pages['leaderboard']:
        return this.pages['loginScreen'];
      case this.pages['targetList']: // to go from target list to customer-list (did not work) !!!!!!!!!!!!!!!!!!!!
        return this.pages['customerList'];
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
      // hard coded. couldnt come up with anything better :(
    } else if (prev == this.pages['loginScreen']) {
      Spine.Route.navigate("!/login/");
    } else {
      Spine.Route.navigate("!/targets/");
    }
  },
  loginOk: function() {
    // no config - no need to login
    if (!window.trackConfig || !window.trackConfig.enableAuth) {
      return true;
    }
    return (User.getUser().logged || this.noLogin)
  },
  noLogin: false
});

if (window.trackConfig && window.trackConfig.serverURL) {
  App.serverURL = window.trackConfig.serverURL
} else{
  App.serverURL = "http://86.50.143.113";
  //App.serverURL = "http://mkos.futupeople.com/track/";
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
  return "!/" + obj.getResourceName() + "/" + obj.getId();
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
