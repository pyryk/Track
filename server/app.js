var Mongo = require('./modules/mongo');

var confs = {
    port: 80,
    name: "TrackAPI"
}

Mongo.init();

require('./modules/server').createServer(confs).start();