var Instance = require('./instance');

module.exports = function ResourceManager() {
    // List of application instances
    var instances = [];

    var self = this;
    
    // Some port we know to be available (useful for creating local test instances)
    var availablePort = 8001;

    // Number of milliseconds between each uptime check
    var POLL_FREQUENCY = 5000;
    
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

    this.getInstances = function() {
        return instances;
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
        //console.log("checkAlive: TODO");
    };
    
    this.pollInstances = function() {
        console.log("Polling...");
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
        initialInstances.forEach(function(instance) {
            instances.push(new Instance(instance.host, instance.port, Math.round(Math.random()*100)));
        });
        console.log("Found " + instances.length + " bootstrap instances");

        // Start polling
        setInterval(function() {self.pollInstances()}, POLL_FREQUENCY);
    };

    this.emit = function(event, request) {
      console.log("Received " + event);
        switch(event) {
            case "serverFailure":
                console.log("ServerFailure for " + request);
                break;
        }
    };
};
