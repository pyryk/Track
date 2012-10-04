var Mongo = require('./modules/mongo');

var confs = {
    //port: 8080,
    port: 80, // Debug
    name: "TrackAPI"

}

Mongo.init();

require('./modules/server').createServer(confs).start();