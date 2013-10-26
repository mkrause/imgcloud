var http = require('q-io/http');
var redis = require('then-redis');

var config = require('../config.js');
var Instance = require('./instance.js');
var DigitalOcean = require('./digital_ocean.js');
var DigitalOceanFake = require('./digital_ocean_fake.js');
var average = require('./average.js');

module.exports = function ResourceManager() {
    var self = this;

    // Redis database used for storage
    this.db = redis.createClient();

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

    this.allocateInstance = function() {
        // Enforce upper bound on the number of instances
        var numInstances = this.instances.length;
        var canAllocate = numInstances < config.MAX_INSTANCES;

        if (!canAllocate) {
            console.log("allocateInstance: did not allocate, upper bound reached");
            return;
        }

        var id = this.availableId;
        console.log("Allocating instance with ID: " + id);

        this.availableId += 1;
        return this.digitalOcean.allocate(id);
    };

    this.deallocateInstance = function(instance) {
        // Enforce lower bound on the number of instances
        var numInstances = this.instances.length;
        var canDeallocate = numInstances > config.MIN_INSTANCES;

        if (!canDeallocate) {
            console.log("deallocateInstance: did not deallocate, lower bound reached");
            return;
        }

        console.log("Deallocating instance: " + instance);
        this.removeInstance(victim);
        return this.digitalOcean.deallocate(instance);
    };

    this.addInstance = function(instance) {
        this.instances.push(instance);
    };

    this.removeInstance = function(instance) {
        var index = this.instances.indexOf(instance);
        if (index != -1) {
            this.instances.splice(index, 1);
        }
    };

    this.markInstanceDead = function(instance) {
        console.log("markInstanceDead: marking %s", instance);
        instance.notifyDead();

        // Remove instance
        this.removeInstance(instance);

        this.deallocateInstance(instance)
            .then(function() {
                console.log("Succesfully deallocated: " + instances);
            })
            .fail(console.error);

        // Check if we need to allocate a new instance to make up for the deallocated one
        if (this.instances.length < config.MIN_INSTANCES) {
            this.allocateInstance();
        }
    };

    this.getInstances = function() {
        return this.instances;
    };

    this.getRunningInstances = function() {
        return this.instances.filter(function(instance) {
            return instance.isRunning();
        });
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
                    instance.notifyAlive();
                })
                .fail(function(error) {
                    if (instance.isStarting()) {
                        // Fine, we'll forgive you for now
                        console.log("pollInstances: %s has not booted yet", instance);
                        return;
                    }

                    console.log("pollInstances: %s died", instance);
                    self.markInstanceDead(instance);
                });
        }, this);
    };

    // Calculate the average load over instances in the system
    this.calculateSystemLoad = function() {
        var instanceLoads = [];
        this.instances.forEach(function(instance) {
            instanceLoads.push(instance.load);
        }, this);

        return average(instanceLoads);
    };

    // Provision (allocate or deallocate) resources based on the system load
    this.provision = function() {
//        var systemLoad = 20 * Math.random();
        var systemLoad = this.calculateSystemLoad(); //TODO
        console.log("System load: %s, thresholds are %s and %s", systemLoad, config.DEALLOCATION_THRESHOLD, config.ALLOCATION_THRESHOLD);

        if (systemLoad > config.ALLOCATION_THRESHOLD) {
            console.log("provision: allocate");

            var id = this.availableId++;
            this.allocateInstance(id)
                .then(function(instance) {
                    self.addInstance(instance);
                })
                .fail(console.error);
        } else if (systemLoad < config.DEALLOCATION_THRESHOLD) {
            console.log("provision: deallocate");

            // Randomly kill some instance
            var victim = this.getRunningInstances()[0];
            this.deallocateInstance(victim);
        } else {
            console.log("provision: all is well");
        }
    };

    this.startProvisioning = function(freq) {
        freq = freq || config.PROVISION_FREQUENCY;

        // Check the load at regular intervals, and provision accordingly
        setInterval(this.provision.bind(this), freq);
    };

    // Bootstrap the resource manager, with an optional set of initial instances
    this.bootstrap = function(initialInstances) {
        initialInstances = initialInstances || [];

        this.instances = [];
        initialInstances.forEach(function(instInfo) {
            var inst = new Instance(instInfo.id, instInfo.host, instInfo.port);
            this.addInstance(inst);

            // Make sure our availableId is higher
            this.availableId = Math.max(this.availableId, instInfo.id + 1);
        }, this);

        console.log("Initialized RM (with %d bootstrap instances)", this.instances.length);
    };

    this.saveRequestStats = function(instanceId, res) {
        var format = function(num) {
            return num < 10 ? "0" + num : num;
        }

        var curTime = new Date;
        var keyBit = instanceId + "-"+format(curTime.getHours()) + ":"+ format(curTime.getMinutes()) + ":" + format(curTime.getSeconds());

        var values = {}

        // Store the LB and app response times
        values["imgcloud-response-" + keyBit] = +curTime - parseInt(res.getHeader('x-imgcloud-start-lb'), 10)

        // Store the instance load
        if(res.getHeader('x-imgcloud-osload')) {
            values["imgcloud-osload-" + keyBit] = res.getHeader('x-imgcloud-osload').split(",")[0];
        } else {
            console.log("saveRequestStats ERROR: no osload provided");
        }

        this.db.mset(values);
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
