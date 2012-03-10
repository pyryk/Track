var restify = require('restify');
var API = require('./api');
var Mongo = require('./mongo');

// Private server
var server;
var confs;

var Server = {

    createServer: function(serverConfigurations) {
        confs = serverConfigurations;

        server = restify.createServer({
            name: confs.name
        });

        server.use(restify.bodyParser());

        return this;
    },

    start: function() {
        API.start(server);

        server.listen(confs.port, function() {
            console.log('%s listening at %s', server.name, server.url);
        });
    }
}

module.exports = Server;