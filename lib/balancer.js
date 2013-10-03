exports.balance = function(rm) {
    var sorted_instances = rm.getInstances().sort(function(a, b) {
        return a.load - b.load;
    });

    return sorted_instances[0];
}