
var Relevancy = {

    calculate: function(targets) {
        targets.forEach(function(target) {
            target.relevancy = Math.random() * 10;
        });
    }

}

module.exports = Relevancy;