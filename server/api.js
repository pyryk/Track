var Mongo = require('./mongo');

var API = {
    start: function(server) {
        server.get("/targets", this.getTargets);
        server.get("/target/:id", this.getTarget);
        server.post("/target", this.postTarget);
        server.post("/target/:_id/result", this.postResult);
    },

    getTargets: function(req, res, next) {
        Mongo.findAllTargets().then(function(data) {
            var targets = data.map(function(target) {
                return API.selectFields(target, ['name', '_id']);
            });

            res.send(200, {targets: targets});
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
        Mongo.createTarget(req.params).then(function(id) {
            res.send(201, {_id: id});
            return next();
        }, function(error) {
            return next(error);
        });
    },

    postResult: function(req, res, next) {
        Mongo.addResult(req.params).then(function() {
            res.send(204, null);
            return next();
        }, function(error) {
            return next(error);
        });
    },

    selectFields: function(obj, fields) {
        var selectedFields = {};

        fields.forEach(function(value) {
            selectedFields[value] = obj[value];
        });

        return selectedFields;
    }
}

module.exports = API;