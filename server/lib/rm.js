var http = require('q-io/http');
var Instance = require('./instance.js');
var DigitalOcean = require('./digital_ocean.js');

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
        digitalOcean.allocate();
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

    this.markInstanceDead = function(instance_obj) {
        console.log("markInstanceDead: marking %s", instance_obj);
        // Remove instance
        var instance = this.getInstance(instance_obj);
        var index = instances.indexOf(instance);
        if (index != -1) {
            instances.splice(index, 1);
        }
    };

    this.getInstances = function() {
        return instances;
    };

    this.getInstance = function(inst) {
        var instance = false;
        instances.forEach(function(i) {
            if(i.equals(inst)) {
                instance = i;
                return;
            }
        });
        return instance;
    }

    this.pingInstance = function(instance, onSuccess, onError) {
        http.request("http://" + instance.host + ":" + instance.port + "/ping").then(onSuccess).fail(onError);
    };

    this.pollInstances = function() {
        console.log("Polling... %s", instances.length);
        instances.forEach(function(instance) {
            var onSuccess = function(data) {
                instance.load = data.headers['x-imgcloud-load'].split(',')[0];
                console.log("pollInstances: %s is alive", instance);
            };
            var onError = function() {
                console.log("pollInstances: %s died", instance);
                self.markInstanceDead(instance);
            };
            self.pingInstance(instance, onSuccess, onError);
        });
    };

    this.setInstanceLoad = function(host, port, load) {
        var instance = this.getInstance({host: host, port: port})
        instance.load = load.split(",")[0];
    }

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

            case "requestEnd":
                var host = res.headers['x-imgcloud-host'].split(":");
                console.log("requestEnd, setting load to %s", res.headers['x-imgcloud-load']);
                this.setInstanceLoad(host[0], host[1], res.headers['x-imgcloud-load'])
                break;
        }
    };
};
