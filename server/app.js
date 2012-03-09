var Mongo = require('./mongo');

var confs = {
    port: 9999,
    name: "TrackAPI"
}

Mongo.init();

require('./server').createServer(confs).start();