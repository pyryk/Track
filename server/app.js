var Mongo = require('./modules/mongo');

var confs = {
    port: 9999,
    name: "TrackAPI"
}

Mongo.init();

require('./modules/server').createServer(confs).start();