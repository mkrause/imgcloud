var balancer = require('./balancer');
var cookie = require('cookie');
var Memcached = require('memcached');

var config = require('../config.js');

module.exports = function resolve(req, rm) {
    var instance = false;
    if (req.headers.cookie) {
        var headers = cookie.parse(req.headers["cookie"]);
        instance = rm.getInstance(headers["imgcloud-host"]);
    }

    // Check if we can keep our promise to redirect the user to the same machine
    if (instance) {
        // Accept user preferences up until the allocation threshold for a machine
        if (!instance.isRunning() || instance.load > config.ALLOCATION_THRESHOLD) {
            console.log("Redirecting to default instance failed");
            instance = false;
        } else {
            console.log("Redirecting to %s again", instance);
        }
    }

    // Fallback: ask the load balancer to choose a suitable instance
    if (!instance) {
        instance = balancer.balance(rm);
    }
    return instance;
};
