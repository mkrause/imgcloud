var http = require('http');
var httpProxy = require('http-proxy');

var config = require('./config.js');
var ResourceManager = require('./lib/rm.js');
var resolve = require('./lib/resolve.js');

// Initialize the resource manager
var rm = new ResourceManager();
var initialInstances = require('./config.js').initialInstances;
rm.bootstrap(initialInstances);
rm.startProvisioning();

// Number of requests per instance (which we can use to indicate the load of an instance)
var requests = {};
var systemLoadHistory = [];

// Start polling
setInterval(poll, config.POLL_FREQUENCY);

// Start proxy server
var server = httpProxy.createServer(function (req, res, proxy) {
    try {
        // Find some instance to which we can pass this request
        var instance = resolve(req, rm);

        // Track the number of pending requests per instance
        if (req.url == "/images/upload") {
            if (!requests[instance.id]) {
                requests[instance.id] = 0;
            }
            requests[instance.id]++;
            instance.load = requests[instance.id];

            console.log("Proxied to %s, has %s open connections", instance, requests[instance.id]);
        }

        req.headers["x-imgcloud-host"] = instance.id;
        req.headers["x-imgcloud-start-lb"] = +new Date;

        proxy.proxyRequest(req, res, {
            host: instance.host,
            port: instance.port
        });
    } catch (e) {
        res.writeHead(500, {
            "Content-Type": "text/plain"
        });

        res.end("Fail whale:\n" + e.stack + "\n");
    }
}).listen(8000);

server.proxy.on('end', function (req, res) {
    // Lower (and update) the num of open connections for the instance
    recordRequestEnd(req.url, req.headers['x-imgcloud-host']);
    rm.emit("requestEnd", req, res);
});

server.proxy.on('proxyError', function (err, req, res) {
    console.log("proxyError");
    recordRequestEnd(req.url, req.headers['x-imgcloud-host']);

    res.writeHead(500, {
        "Content-Type": "text/plain"
    });
    res.end("Proxy error while redirecting request to " + req.headers['x-imgcloud-host'] + "\n");
    rm.emit('serverFailure', req, res);
});

function recordRequestEnd(url, id) {
    if (url == "/images/upload") {
        var instanceId = parseInt(id, 10);
        requests[instanceId]--;

        var instance = rm.getInstance(instanceId);
        if (instance) {
            instance.load = requests[instanceId];
        }
    }
}

// Get the average of a numerical array
function average(arr) {
    var sum = arr.reduce(function(prev, cur) {
        return prev + cur;
    }, 0);
    
    var avg;
    if (arr.length == 0) {
        avg = 0;
    } else {
        avg = sum / arr.length;
    }
    
    return avg;
}

function poll() {
    // Have the RM poll each instance (e.g. to check if they're alive)
    rm.pollInstances();
    
    // Calculate the current system load
    var instanceLoads = [];
    rm.getInstances().forEach(function(instance) {
        instanceLoads.push(instance.load);
    });
    var load = average(instanceLoads);
    
    // Remove the first element, if we've exceeded the window size
    if (systemLoadHistory.length >= config.LOAD_HISTORY_WINDOW_SIZE) {
        systemLoadHistory.shift();
    }
    
    // Store the current load of the instance in our sliding window
    systemLoadHistory.push(load);
}
