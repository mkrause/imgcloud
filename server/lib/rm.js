var http = require('q-io/http');
var Instance = require('./instance.js');
var DigitalOcean = require('./digital_ocean.js');

module.exports = function ResourceManager() {
    var self = this;
    
    this.digitalOcean = new DigitalOcean(require('../digital_ocean_config.js'));
    
    // List of application instances
    this.instances = [];
    
    this.availableId = 1;
    
    // Some port we know to be available (useful for creating local test this.instances)
    this.availablePort = 8001;
    
    // Number of milliseconds between each uptime check
    this.POLL_FREQUENCY = 5000;
    
    this.allocateInstance = function() {
        /*
        var port = availablePort;
        http.createServer(function (req, res) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.write('yay (' + port + ')');
            res.end();
        }).listen(port);

        var id = port; // Since the port should be unique, we can use it as an ID as well
        var instance = new Instance(id, 'localhost', port);
        availablePort += 1;
        */
        
        var id = this.availableId;
        console.log("Allocating instance with ID: " + id);
        
        this.availableId += 1;
        return this.digitalOcean.allocate(id);
    };
    
    this.deallocateInstance = function(instance) {
        console.log("Deallocating instance: " + instance);
        return this.digitalOcean.deallocate(instance);
    };

    this.markInstanceDead = function(instance_obj) {
        console.log("markInstanceDead: marking %s", instance_obj);
        // Remove instance
        var instance = this.getInstance(instance_obj);
        var index = this.instances.indexOf(instance);
        if (index != -1) {
            this.instances.splice(index, 1);
        }
    };

    this.getInstances = function() {
        return this.instances;
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
    
    this.pingInstance = function(instance) {
        return http.read("http://" + instance.host + ":" + instance.port + "/ping");
    };
    
    this.pollInstances = function() {
        console.log("Polling... %s", this.instances.length);
        this.instances.forEach(function(instance) {
            self.pingInstance(instance)
                .then(function() {
                    instance.load = data.headers['x-imgcloud-load'].split(',')[0];
                    console.log("pollInstances: %s is alive", instance);
                })
                .fail(function() {
                    console.log("pollInstances: %s died", instance);
                    self.markInstanceDead(instance);
                });
        });
    };

    this.setInstanceLoad = function(host, port, load) {
        var instance = this.getInstance({host: host, port: port})
        instance.load = load.split(",")[0];
    }

    this.bootstrap = function(initialInstances) {
        this.instances = [];
        initialInstances.forEach(function(instInfo) {
            var id = this.availableId++;
            var load = Math.round(Math.random() * 100);
            var inst = new Instance(id, instInfo.host, instInfo.port, load);
            this.instances.push(inst);
        });
        console.log("Found " + this.instances.length + " bootstrap instances");
        
        // Start polling
        setInterval(this.pollInstances, this.POLL_FREQUENCY);
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
//                var host = res.headers['x-imgcloud-host'].split(":");
//                console.log("requestEnd, setting load to %s", res.headers['x-imgcloud-load']);
//                this.setInstanceLoad(host[0], host[1], res.headers['x-imgcloud-load']);
                // track processing time
                break;
        }
    };
};
