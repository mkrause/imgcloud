var Instance = require('instance');

exports.ResourceManager = function() {
    this.instances = [];
    this.availablePort = 8001;
    
    this.allocateInstance = function() {
        //var droplet = digitalOcean.createDroplet();
        //droplet.host
        
        var port = this.availablePort;
        http.createServer(function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.write('yay (' + port + ')');
            res.end();
        }).listen(port);
        
        var instance = new Instance('localhost', port);
        this.availablePort += 1;
    };
    
    this.pollInstances = function() {
        
    };
    
    this.bootstrap = function(initialInstances) {
        initialInstances.forEach(function(instance) {
            instances.push(new Instance(instance.host, instance.port));
        });
        
        // Start polling
        setInterval(this.pollInstances, 1000);
    };
};
