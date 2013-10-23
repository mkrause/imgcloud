// Example file, copy to api_key.js and fill in your DigitalOcean API key
var config = {
    client_id: "p4F9BVhFJso91hBdfYoVd",
    size_id: 33,
    image_id: 1, // TODO
    region_id: 2
    //ssh_key_ids
};

// Add the API key (which is stored separate so as not to be committed to the repository)
config.api_key = require('./digital_ocean_api_key.js');

if (!config.api_key) {
    throw new Error("No DigitalOcean API key provided");
}

module.exports = config;
