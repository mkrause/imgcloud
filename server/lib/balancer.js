
exports.balance = function(rm) {
    var sorted_instances = rm.getRunningInstances().sort(function(a, b) {
//        return a.load - b.load;
        return 0.5 - Math.random();
    });

    return sorted_instances[0];
};
