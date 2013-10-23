var http = require('q-io/http');
var Instance = require('./instance.js');
var DigitalOcean = require('./digital_ocean.js');

// Get the average of a numerical array
function average(arr) {
    var sum = arr.reduce(function(prev, cur) {
        return prev + cur;
    }, 0);
    
    var avg;
    if (arr.length == 0) {
        avg = 0;
    } else {
        avg = sum / arr.length;
    }
    
    return avg;
}

module.exports = function ResourceManager() {
    var self = this;
    
    // Number of milliseconds between each uptime check
    this.POLL_FREQUENCY = 5 * 1000;
    
    // Number of milliseconds between each provisioning
    this.PROVISION_FREQUENCY = 30 * 1000;
    
    this.LOAD_HISTORY_WINDOW_SIZE = parseInt(this.PROVISION_FREQUENCY / this.POLL_FREQUENCY, 10);
    
    // Bounds on the number of limits
    this.MIN_INSTANCES = 2;
    this.MAX_INSTANCES = 10;
    
    // Thresholds for allocating or deallocating instances
    this.ALLOCATION_THRESHOLD = 0.80;
    this.DEALLOCATION_THRESHOLD = 0.50;
    
    // Client for our IaaS provider (DigitalOcean)
    this.digitalOcean = new DigitalOcean(require('../digital_ocean_config.js'));
    
    // List of application instances
    this.instances = [];
    
    // Some ID that is guaranteed to be currently available
    this.availableId = 1;
    
    // Some port we know to be available (useful for creating local test this.instances)
    this.availablePort = 8001;
    
    this.allocateInstance = function() {
        /*
        //XXX local allocation
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

    this.markInstanceDead = function(instance) {
        console.log("markInstanceDead: marking %s", instance);
        
        // Remove instance
        var index = this.instances.indexOf(instance);
        if (index != -1) {
            this.instances.splice(index, 1);
        }
        
        this.deallocateInstance(instance)
            .then(function() {
                console.log("Succesfully deallocated: " + instances);
            })
            .fail(console.error);
        
        // Check if we need to allocate a new instance to make up
        if (this.instances.length < this.MIN_INSTANCES) {
            this.allocateInstance();
        }
    };

    this.getInstances = function() {
        return this.instances;
    };

    this.getInstance = function(inst) {
        var instance = false;
        this.instances.forEach(function(i) {
            if(i.equals(inst)) {
                instance = i;
                return;
            }
        }, this);
        return instance;
    };
    
    this.pingInstance = function(instance) {
        return http.request("http://" + instance.host + ":" + instance.port + "/ping");
    };
    
    this.setInstanceLoad = function(host, port, load) {
        var instance = this.getInstance({host: host, port: port})
        instance.load = load.split(",")[0];
    };
    
    this.recordInstanceLoad = function(instance) {
        if (!instance.loadHistory) {
            instance.loadHistory = [];
        }
        
        // Remove the first element, if we've exceeded the window size
        if (instance.loadHistory.length >= this.LOAD_HISTORY_WINDOW_SIZE) {
            instance.loadHistory.shift();
        }
        
        instance.loadHistory.push(instance.load);
    };
    
    this.pollInstances = function() {
        console.log("Polling... (%d instances)", this.instances.length);
        this.instances.forEach(function(instance) {
            this.pingInstance(instance)
                .then(function(data) {
                    instance.load = Number(data.headers['x-imgcloud-load'].split(',')[0]);
                    console.log("pollInstances: %s is alive", instance);
                    
                    // Save the load for this instance in its history
                    self.recordInstanceLoad(instance);
                })
                .fail(function() {
                    console.log("pollInstances: %s died", instance);
                    self.markInstanceDead(instance);
                });
        }, this);
    };
    
    this.calculateSystemLoad = function() {
        var instanceLoads = [];
        this.instances.forEach(function(instance) {
            instanceLoads.push(average(instance.loadHistory || []));
        }, this);
        
        return average(instanceLoads);
    };
    
    // Provision (allocate or deallocate) resources based on the system load
    this.provision = function() {
        var systemLoad = this.calculateSystemLoad();
        console.log("System load: " + systemLoad);
        
        var numInstances = this.instances.length;
        if (systemLoad > this.ALLOCATION_THRESHOLD && numInstances < this.MAX_INSTANCES) {
            this.allocateInstance();
        } else if (systemLoad < this.DEALLOCATION_THRESHOLD && numInstances > this.MIN_INSTANCES) {
            this.deallocateInstance();
        }
    };
    
    // Bootstrap the resource manager, with an optional set of initial instances
    this.bootstrap = function(initialInstances) {
        initialInstances = initialInstances || [];
        
        this.instances = [];
        initialInstances.forEach(function(instInfo) {
            var load = Math.round(Math.random() * 100);
            var inst = new Instance(instInfo.id, instInfo.host, instInfo.port, load);
            this.instances.push(inst);
            
            // Make sure our availableId is higher
            this.availableId = Math.max(this.availableId, instInfo.id + 1);
        }, this);
        console.log("Found " + this.instances.length + " bootstrap instances");
        
        // Start polling
        setInterval(this.pollInstances.bind(this), this.POLL_FREQUENCY);
        
        // Check the load at regular intervals, and provision accordingly
        setInterval(this.provision.bind(this), this.PROVISION_FREQUENCY);
    };
    
    // Emit an event
    this.emit = function(eventName, req, res) {
        console.log("Received " + eventName);
        switch (eventName) {
            case "serverFailure":
                var instanceId = req.headers['x-imgcloud-host'];
                console.log("ServerFailure for " + instanceId);
                var instance = this.getInstance(instanceId);
                this.markInstanceDead(instance);
                break;

            case "requestEnd":
                var instanceId = res.headers['x-imgcloud-host'];
                var instance = this.getInstance(instanceId);
                instance.load = res.headers['x-imgcloud-load'];
                // track processing time
                break;
        }
    };
};
