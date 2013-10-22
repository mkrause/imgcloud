var https = require('https');
var querystring = require('querystring');

var apiConfig = require('../api_key');
var Instance = require('./instance');

module.exports = function DigitalOcean() {
    function callApi(path, callback) {
        var queryParams = apiConfig; //XXX should deep-clone this
        queryParams.name = 'foo'; // TODO
        
        var options = {
            hostname: "api.digitalocean",
            port: 443,
            path: path + "?" + querystring.stringify(queryParams),
            method: 'GET'
        };
        
        var req = https.request(options, function(res) {
            res.on('data', function(data) {
                callback(false, JSON.parse(data));
            })
        });
        
        req.on('error', function(error) { callback(error); });
    }
    
    // Create a new instance
    this.allocate = function(callback) {
        // Create a new droplet
        callApi('/droplets/new', function(error, createdData) {
            if (error) {
                callback(error);
            }
            
            var dropletId = createdData.droplet.id;
            
            // Get the address of the new droplet
            callApi('/droplets/' + dropletId, function(error, dropletData) {
                if (error) {
                    callback(error);
                }
                
                var ip = dropletData.droplet.ip_address;
                var instance = new Instance(ip, 80);
                callback(false, instance);
            });
        });
    };
    
    // Release the given instance
    this.destroy = function(instance, callback) {
        var dropletId = instance.id;
        
        // Create a new droplet
        callApi('/droplets/' + dropletId + '/destroy', function(error, destroyedData) {
            if (error) {
                callback(error);
            }
            callback(false);
        });
    };
};
