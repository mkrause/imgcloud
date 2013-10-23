// Example file, copy to api_key.js and fill in your DigitalOcean API key
var config = {
    clientId: "p4F9BVhFJso91hBdfYoVd",
    dropletParams: {
        size_id: 66, // Smallest size
        image_id: 1000590, // cc-snapshot1
        region_id: 2, // ams-1
        ssh_key_ids: "9792, 46554"
    }
};

// Add the API key (which is stored separate so as not to be committed to the repository)
config.apiKey = require('./digital_ocean_api_key.js').apiKey;

if (!config.apiKey) {
    throw new Error("No DigitalOcean API key provided");
}

module.exports = config;
