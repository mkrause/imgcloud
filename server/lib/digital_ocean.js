var https = require('https');
var querystring = require('querystring');
var apiConfig = require('../api_key');

module.exports = function DigitalOcean() {
    function callApi(path, onSuccess, onError) {
        var queryParams = apiConfig;
        queryParams.name = 'foo'; // TODO
        
        var options = {
            hostname: "api.digitalocean",
            port: 443,
            path: path + "?" + querystring.stringify(queryParams),
            method: 'GET'
        };
        
        var req = https.request(options, function(res) {
            res.on('data', function(data) {
                onSuccess(JSON.parse(data));
            })
        });
        req.on('error', onError);
    }
    
    this.allocate = function() {
        callApi('/droplets/new', function(response) {
            
        });
    };
};
