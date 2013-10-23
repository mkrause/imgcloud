var _ = require('underscore');
var Instance = require('./instance');
var spawn = require('child_process').spawn;

// Fake implementation of DigitalOcean that uses local processes
module.exports = function DigitalOceanFake() {
    var processes = {};
    
    this.droplets = function() {
        return _.values(processes);
    };
    
    this.droplet = function(id) {
        return processes[id];
    };
    
    this.allocate = function(id) {
        // Assumes we're in the 'server' directory
        var proc = spawn('./start_instance.sh', [id]);
        proc.stdout.on('data', function(data) { console.log("" + data) });
        proc.stderr.on('data', function(data) { console.log("" + data) });
        
        processes[id] = proc;
    };
    
    // Release the given instance
    this.deallocate = function(id) {
        processes[id].kill('SIGHUP');
        delete processes[id];
    };
};
