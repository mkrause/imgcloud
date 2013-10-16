var balancer = require('./balancer');
var cookie = require('cookie');
var Memcached = require('memcached');

var mem = new Memcached();

module.exports = function resolve(req, rm) {
    var sessionId;
    if(req.headers["cookie"]) {
        var headers = cookie.parse(req.headers["cookie"]);
         sessionId = headers["sessionId"];
    }

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
