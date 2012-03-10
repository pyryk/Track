var Mongo = require('./mongo');

var API = {
    start: function(server) {
        server.get("/targets", this.getTargets);
        server.get("/target/:id", this.getTarget);
        server.post("/target", this.postTarget);
    },

    getTargets: function(req, res, next) {
        Mongo.findAllTargets().then(function(data) {
            res.send(200, {targets: data});
            return next();
        }, function(error) {
            return next(error);
        });
    },

    getTarget: function(req, res, next) {
        Mongo.findTargetById(req.params.id).then(function(data) {
            res.send(200, {target: data});
            return next();
        }, function(error) {
            return next(error);
        });
    },

    postTarget: function(req, res, next) {
        Mongo.createTarget(req.params.name).then(function() {
            res.send(201, "");
            return next();
        }, function(error) {
            return next(error);
        });
    }
}

module.exports = API;