var Mongo = require('./modules/mongo');

var confs = {
    port: 8080,
    name: "TrackAPI"
}

Mongo.init();

require('./modules/server').createServer(confs).start();