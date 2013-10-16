var http = require('http');
var httpProxy = require('http-proxy');
var ResourceManager = require('./lib/rm.js');
var resolve = require('./lib/resolve.js');

// Initialize the resource manager
var rm = new ResourceManager("bar");
var initialInstances = require('./instances');
rm.bootstrap(initialInstances);

// Start proxy server
var server = httpProxy.createServer(function(req, res, proxy) {
    try {
        var instance = resolve(req, rm);

        console.log("Proxied to " + instance.toString())

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

server.proxy.on('end', function(req, res, response) {
    console.log("Proxy end:\n")
    console.log(response.headers);
});

server.proxy.on('proxyError', function(err, req, res) {
    res.writeHead(500, {
        "Content-Type": "text/plain"
    });

    res.end("Proxy error while redirecting request to " + Object.keys(this.proxies)[0] +"\n");

    rm.emit('serverFailure', req);
});
