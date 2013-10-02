var balancer = require('balancer');

exports.resolve = function(req, rm) {
    var sessionId = // ...
    
    var instance;
    if (mem.hasKey(sessionId)) {
        // Already have an instance for this session? Use it
        instance = rm.getInstance(mem.get(sessionId));
    }
    
    // Fallback: ask the load balancer to choose a suitable instance
    if (!instance) {
        instance = balancer.balance(rm);
    }
    
    return instance;
}
