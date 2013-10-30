var _ = require('underscore');
var Q = require('q');
var Instance = require('./instance');
var spawn = require('child_process').spawn;

// Fake implementation of DigitalOcean that uses local processes
module.exports = function DigitalOceanFake() {
    var processes = {};
    
    this.droplets = function() {
        return Q.fcall(function() {
            return _.values(processes);
        });
    };
    
    this.droplet = function(id) {
        return Q.fcall(function() {
            if (!processes[id]) {
                throw new Error("No such instance");
            }
            return processes[id];
        });
    };
    
    this.allocate = function(id) {
        return Q.fcall(function() {
            var port = 8000 + id;
            
            // Assumes we're in the 'server' directory
            var proc = spawn('node', ['../imgcloud/server.js', port]);
            proc.stdout.on('data', function(data) { console.log("" + data) });
            proc.stderr.on('data', function(data) { console.log("" + data) });
            
            processes[id] = proc;
            
            return new Instance(id, 'localhost', port);
        });
    };
    
    // Release the given instance
    this.deallocate = function(id) {
        return Q.fcall(function() {
            if (processes[id]) {
                processes[id].kill('SIGHUP');
            }
            delete processes[id];
            
            return true;
        });
    };

    this.instances = function() {
        return Q.fcall(function() {
            return [];
        });
    };

    this.getAddress = function(instance) {
        return Q.fcall(function() {
            return 'localhost';
        });
    };
};
