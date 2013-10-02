var Instance = require('./instance');

module.exports = function ResourceManager() {
    // List of application instances
    var instances = [];
    
    // Some port we know to be available (useful for creating local test instances)
    var availablePort = 8001;
    
    this.allocateInstance = function() {
        //var droplet = digitalOcean.createDroplet();
        //droplet.host
        
        var port = availablePort;
        http.createServer(function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.write('yay (' + port + ')');
            res.end();
        }).listen(port);
        
        var instance = new Instance('localhost', port);
        availablePort += 1;
        return instance;
    };
    
    this.markInstanceDead = function(instance) {
        // Remove instance
        var index = this.instances.indexOf(instance);
        if (index) {
            instances.splice(index);
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

    this.checkAlive = function() {
        console.log("checkAlive: TODO");
    };
    
    this.pollInstances = function() {
        console.log("Polling...");
        self = this;
        instances.forEach(function(instance) {
            var onSuccess = function(data) {
                // should contain data.load (?)
            };
            var onError = function() {
                self.markInstanceDead(instance);
            };
            self.checkAlive(instance, onSuccess, onError);
        });
    };
    
    this.bootstrap = function(initialInstances) {
        instances = initialInstances.map(function(instance) {
            return new Instance(instance.host, instance.port);
        });
        console.log("Found " + instances.length + " bootstrap instances");

        // Start polling
        self = this;
        setInterval(function() {self.pollInstances()}, 1000);
    };
};
