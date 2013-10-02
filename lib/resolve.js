var balancer = require('balancer');
var cookie = require('cookie');

exports.resolve = function(req, rm) {
    var headers = cookie.parse(req.headers["Cookie"]);
    var sessionId = headers["sessionId"];
    
    var instance;
    if (sessionId && mem.hasKey(sessionId)) {
        // Already have an instance for this session? Use it
        instance = rm.getInstance(mem.get(sessionId));
    }
    
    // Fallback: ask the load balancer to choose a suitable instance
    if (!instance) {
        instance = balancer.balance(rm);
    }
    
    return instance;
}
