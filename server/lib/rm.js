var http = require('q-io/http');
var config = require('../config.js');
var Instance = require('./instance.js');
var DigitalOcean = require('./digital_ocean.js');
var DigitalOceanFake = require('./digital_ocean_fake.js');
var redis = require('then-redis');

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

    // Redis database used for storage
    this.DB = redis.createClient();
    
    // Number of milliseconds between each uptime check
    this.POLL_FREQUENCY = 5 * 1000;
    
    // Number of milliseconds between each provisioning
    this.PROVISION_FREQUENCY = 30 * 1000;
    
    // Bounds on the number of limits
    this.MIN_INSTANCES = 2;
    this.MAX_INSTANCES = 10;
    
    // Thresholds for allocating or deallocating instances
    this.ALLOCATION_THRESHOLD = 0.80;
    this.DEALLOCATION_THRESHOLD = 0.50;
    
    // Client for our IaaS provider (DigitalOcean)
    if (config.useDigitalOcean) {
        this.digitalOcean = new DigitalOcean(config.digitalOcean);
    } else {
        this.digitalOcean = new DigitalOceanFake();
    }
    
    // List of application instances
    this.instances = [];
    
    // Some ID that is guaranteed to be currently available
    this.availableId = 1;
    
    // Some port we know to be available (useful for creating local test this.instances)
    this.availablePort = 8001;
    
    this.allocateInstance = function() {
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
    
    this.getInstance = function(id) {
        var instance = false;
        this.instances.forEach(function(inst) {
            if (inst.id == id) {
                instance = inst;
                return false; // Break
            }
        }, this);
        
        return instance;
    };
    
    this.pingInstance = function(instance) {
        return http.request("http://" + instance.host + ":" + instance.port + "/ping");
    };

    this.pollInstances = function() {
        console.log("Polling... (%d instances)", this.instances.length);
        this.instances.forEach(function(instance) {
            this.pingInstance(instance)
                .then(function(data) {
                    console.log("pollInstances: %s is alive", instance);
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
            instanceLoads.push(instance.averageLoad());
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
            this.deallocateInstance(this.instances[0]); // Randomly kill some instance
        }
    };
    
    // Bootstrap the resource manager, with an optional set of initial instances
    this.bootstrap = function(initialInstances) {
        initialInstances = initialInstances || [];
        
        this.instances = [];
        initialInstances.forEach(function(instInfo) {
            var inst = new Instance(instInfo.id, instInfo.host, instInfo.port);
            this.instances.push(inst);
            
            // Make sure our availableId is higher
            this.availableId = Math.max(this.availableId, instInfo.id + 1);
        }, this);
        console.log("Found " + this.instances.length + " bootstrap instances");

        // Start polling
        if(process.env.POLL != 0) {
            setInterval(this.pollInstances.bind(this), this.POLL_FREQUENCY);

            // Check the load at regular intervals, and provision accordingly
            setInterval(this.provision.bind(this), this.PROVISION_FREQUENCY);
        }
    };

    this.saveRequestStats = function(instanceId, res) {
        var curTime = new Date;
        var keyBit = instanceId + "-"+curTime.getHours() + ":"+ curTime.getMinutes() + ":" + curTime.getSeconds();
        // Store the LB and app response times
        this.DB.rpush("imgcloud-response-" + keyBit, +curTime - parseInt(res.getHeader('x-imgcloud-start-lb'), 10));

        // Store the instance load
        this.DB.rpush("imgcloud-osload-" + keyBit, res.getHeader('x-imgcloud-osload').split(",")[0]);
    };
    
    // Emit an event
    this.emit = function(eventName, req, res) {
        console.log("Received " + eventName);
        var instanceId = req.headers['x-imgcloud-host'];
        var instance = this.getInstance(instanceId);

        switch (eventName) {
            case "serverFailure":
                console.log("ServerFailure for " + instanceId);
                this.markInstanceDead(instance);
                break;

            case "requestEnd":
                if(req.url == "/images/upload") {
                    this.saveRequestStats(instanceId, res);
                }
                break;
        }
    };
};
