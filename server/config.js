
// Local user-configurable parameters
var params = require('./params.js');
if (!params) {
    throw new Error("params.js does not exist");
}

module.exports = {
    initialInstances: params.initialInstances,
    
    useDigitalOcean: false,
    digitalOcean: {
        apiKey: params.digitalOcean.apiKey,
        clientId: "p4F9BVhFJso91hBdfYoVd",
        dropletParams: {
            size_id: 66, // Smallest size
            image_id: 1000590, // cc-snapshot1
            region_id: 2, // ams-1
            ssh_key_ids: "9792, 46554"
        }
    },
    
    POLL_FREQUENCY: 5 * 1000,
    PROVISION_FREQUENCY: 30 * 1000,
    MIN_INSTANCES: 2,
    MAX_INSTANCES: 10,
    ALLOCATION_THRESHOLD: 12, // Average load 
    DEALLOCATION_THRESHOLD: 2
};
