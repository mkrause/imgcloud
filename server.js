var http = require('http');
var httpProxy = require('http-proxy');
var ResourceManager = require('./lib/rm.js');
var resolve = require('./lib/resolve.js');

// Initialize the resource manager
var rm = new ResourceManager("bar");
var initialInstances = require('./instances');
console.log(initialInstances);
rm.bootstrap(initialInstances);

// Start proxy server
var server = httpProxy.createServer(function(req, res, proxy) {
    try {
        var instance = resolve(req, rm);
    } catch (e) {
        res.writeHead(500, {
            "Content-Type": "text/plain"
        });
        
        res.end("Fail whale");
    }
    
    proxy.proxyRequest(req, res, {
        host: instance.host,
        port: instance.port
    });
}).listen(8000);

server.proxy.on('proxyError', function(err, req, res) {
    res.writeHead(500, {
        "Content-Type": "text/plain"
    });
    
    res.end("Proxy error\n");
    
    rm.fire('serverFailure', req);
});
