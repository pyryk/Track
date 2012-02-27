var Mongo = require('./mongo');

var API = {
    start: function(server) {
        server.get("/targets", this.getTargets);
        server.get("/target/:id", this.getTarget);
        server.post("/target/:id", this.postTarget);
    },

    getTargets: function(req, res, next) {
        Mongo.findAllTargets().then(function(data) {
            res.send(data);
        });
    },

    getTarget: function(req, res, next) {
        res.send('not implemented');
    },

    postTarget: function(req, res, next) {
        res.send('not implemented');
    }
}

module.exports = API;