var http = require('q-io/http');
var querystring = require('querystring');
var Instance = require('./instance');

// Deep clone the given object (using a little hack)
function clone(obj) {
   return JSON.parse(JSON.stringify(obj));
}

module.exports = function DigitalOcean(apiConfig) {
    if (!apiConfig) {
        throw new Error("No API config provided");
    }
    
    this.apiConfig = apiConfig;
    
    function callApi(path) {
        var queryParams = clone(apiConfig);
        
        queryParams.name = 'foo'; // TODO
        
        var options = {
            hostname: "api.digitalocean.com",
            port: 443,
            path: path + "?" + querystring.stringify(queryParams),
            method: 'GET'
        };
        
        var qs = querystring.stringify(queryParams);
        var url = "https://api.digitalocean.com" + path + "?" + qs;
        return http.read(url).then(JSON.parse);
    }
    
    // Get the droplet list
    this.droplets = function() {
        return callApi('/droplets/')
            .then(function(response) {
                return response.droplets;
            });
    };
    
    // Get information on the droplet with the given ID
    this.droplet = function(id) {
        return callApi('/droplets/' + id)
            .then(function(response) {
                return response.droplet;
            });
    };
    
    // Create a new instance
    this.allocate = function() {
        return callApi('/droplets/new')
            .then(function(response) {
                return callApi('/droplets/' + response.droplet.id);
            })
            .then(function(response) {
                var droplet = response.droplet;
                return new Instance(droplet.id, droplet.ip_address, 80);
            });
    };
    
    // Release the given instance
    this.destroy = function(instance) {
        var dropletId = instance.id;
        return callApi('/droplets/' + dropletId + '/destroy');
    };
};
