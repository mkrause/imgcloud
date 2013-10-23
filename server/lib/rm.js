var Instance = require('./instance');
var DigitalOcean = require('./digital_ocean');
var http = require('http');

module.exports = function ResourceManager() {
    var digitalOcean = new DigitalOcean(require('../digital_ocean_config.js'));
    
    // List of application instances
    var instances = [];

    var self = this;
    
    // Some port we know to be available (useful for creating local test instances)
    var availablePort = 8001;

    // Number of milliseconds between each uptime check
    var POLL_FREQUENCY = 5000;
    
    this.allocateInstance = function() {
        /*
        digitalOcean.allocate(function(error, instance) {
            
        });
        */
        
        var port = availablePort;
        http.createServer(function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.write('yay (' + port + ')');
            res.end();
        }).listen(port);
        
        var id = port; // Since the port should be unique, we can use it as an ID as well
        var instance = new Instance(id, 'localhost', port);
        availablePort += 1;
        
        return instance;
    };
    
    this.markInstanceDead = function(instance) {
        console.log("markInstanceDead: marking %s", instance);
        // Remove instance
        var equals_array = instances.map(function(i) {
            return i.equals(instance);
        });
        var index = equals_array.indexOf(true);
        if (index != -1) {
            instances.splice(index, 1);
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
            console.log(res);
            res.on('data', function(data) {
                onSuccess(JSON.parse(data));
            });
        });
        req.on('error', onError);
    };

    this.pollInstances = function() {
        console.log("Polling... %s", instances.length);
        instances.forEach(function(instance) {
            var onSuccess = function(data) {
                // should contain data.load (?)
                console.log("pollInstances: %s is alive", instance);
            };
            var onError = function() {
                console.log("pollInstances: %s died", instance);
                self.markInstanceDead(instance);
            };
            self.pingInstance(instance, onSuccess, onError);
        });
    };
    
    this.bootstrap = function(initialInstances) {
        instances = [];
        initialInstances.forEach(function(instance) {
            instances.push(new Instance(null, instance.host, instance.port, Math.round(Math.random()*100)));
        });
        console.log("Found " + instances.length + " bootstrap instances");

        // Start polling
        setInterval(function() {self.pollInstances()}, POLL_FREQUENCY);
    };

    this.emit = function(event, req, res) {
        console.log("Received " + event);
        switch(event) {
            case "serverFailure":
                var host = res.getHeader('X-imgcloud-host').split(":");
                this.markInstanceDead(new Instance(null, host[0], host[1]));
                console.log("ServerFailure for " + res.getHeader('X-imgcloud-host'));
                break;
        }
    };
};
