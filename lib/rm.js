var Instance = require('instance');

exports.ResourceManager = function() {
    // List of application instances
    this.instances = [];
    
    // Some port we know to be available (useful for creating local test instances)
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
    
    this.markInstanceDead = function(instance) {
        // Remove instance
        var index = this.instances.indexOf(instance);
        if (index) {
            this.instances.splice(index);
        }
    };
    
    this.pingInstance = function(instance, onSuccess, onError) {
        var options = {
            hostname: instance.host,
            port: instance.port,
            path: '/ping',
            method: 'GET'
        };
        
        var req = http.request(options, function(res) {
            res.on('data', function(data) {
                onSuccess(JSON.parse(data));
            })
        });
        req.on('error', onError);
    };
    
    this.pollInstances = function() {
        this.instances.forEach(function(instance) {
            var onSuccess = function(data) {
                // should contain data.load (?)
            };
            var onError = function() {
                this.markInstanceDead(instance);
            };
            this.checkAlive(instance, onSuccess, onError);
        });
    };
    
    this.bootstrap = function(initialInstances) {
        initialInstances.forEach(function(instance) {
            instances.push(new Instance(instance.host, instance.port));
        });
        
        // Start polling
        setInterval(this.pollInstances, 1000);
    };
};
