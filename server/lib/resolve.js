var balancer = require('./balancer');
var cookie = require('cookie');
var Memcached = require('memcached');

var mem = new Memcached();

module.exports = function resolve(req, rm) {
    // Accept user preferences up until this threshold
    var AB_THRESHOLD = 0.8;

    var previousHost;
    if (req.headers["cookie"]) {
        var headers = cookie.parse(req.headers["cookie"]);
        previousHost = headers["imgcloud-host"].split(",");
    }

    var instance;
    if (previousHost) {
        console.log({host: previousHost[0], port: previousHost[1]});
        instance = rm.getInstance({host: previousHost[0], port: previousHost[1]});
        console.log("Redirecting to %s again", instance);
        if(instance.load > AB_THRESHOLD) {
            instance = null;
        }
    }

    // Fallback: ask the load balancer to choose a suitable instance
    if (!instance) {
        instance = balancer.balance(rm);
    }
    return instance;
}
