var https = require('https');
var querystring = require('querystring');

var apiConfig = require('../api_key');
var Instance = require('./instance');

module.exports = function DigitalOcean() {
    function callApi(path, nodeback) {
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
                nodeback(null, JSON.parse(data));
            })
        });
        
        req.on('error', function(error) { nodeback(error); });
    }
    
    // Create a new instance
    this.allocate = function(nodeback) {
        // Create a new droplet
        callApi('/droplets/new', function(error, createdData) {
            if (error) {
                nodeback(error);
            }
            
            var dropletId = createdData.droplet.id;
            
            // Get the address of the new droplet
            callApi('/droplets/' + dropletId, function(error, dropletData) {
                if (error) {
                    nodeback(error);
                }
                
                var ip = dropletData.droplet.ip_address;
                var instance = new Instance(ip, 80);
                nodeback(null, instance);
            });
        });
    };
    
    // Release the given instance
    this.destroy = function(instance, nodeback) {
        var dropletId = instance.id;
        
        // Create a new droplet
        callApi('/droplets/' + dropletId + '/destroy', function(error, destroyedData) {
            if (error) {
                nodeback(error);
            }
            nodeback(null);
        });
    };
};
