var http = require('http');
var httpProxy = require('http-proxy');
var ResourceManager = require('./lib/rm.js');
var resolve = require('./lib/resolve.js');

// Initialize the resource manager
var rm = new ResourceManager();
var initialInstances = require('./config.js').initialInstances;
rm.bootstrap(initialInstances);

// Start proxy server
var server = httpProxy.createServer(function(req, res, proxy) {
    try {
        var instance = resolve(req, rm);
        
        console.log("Proxied to " + instance);
        
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

server.proxy.on('end', function(req, res) {
    rm.emit("requestEnd", req, res);
});

server.proxy.on('proxyError', function(err, req, res) {
    console.log("proxyError");

    res.writeHead(500, {
        "Content-Type": "text/plain"
    });
    res.end("Proxy error while redirecting request to " + req.headers['x-imgcloud-host'] +"\n");
    rm.emit('serverFailure', req, res);
});
