var _ = require('underscore');
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
    
    function callApi(path, params) {
        var params = params || {};
        var queryParams = _.defaults(params, {
            api_key: apiConfig.apiKey,
            client_id: apiConfig.clientId
        });

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
    this.allocate = function(id) {
        var params = clone(this.apiConfig.dropletParams);
        params.name = 'cc-instance' + id;
        
        return callApi('/droplets/new', params)
            .then(function(response) {
                return callApi('/droplets/' + response.droplet.id);
            })
            .then(function(response) {
                var droplet = response.droplet;
                return new Instance(droplet.id, droplet.ip_address, 80);
            });
    };
    
    // Release the given instance
    this.deallocate = function(instance) {
        var dropletId = instance.id;
        return callApi('/droplets/' + dropletId + '/destroy');
    };
};
