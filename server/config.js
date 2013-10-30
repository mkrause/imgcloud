// Local user-configurable parameters
var params = require('./params.js');
if (!params) {
    throw new Error("params.js does not exist");
}

module.exports = {
    initialInstances: params.initialInstances,

    useDigitalOcean: params.useDigitalOcean,
    digitalOcean: {
        apiKey: params.digitalOcean.apiKey,
        clientId: "p4F9BVhFJso91hBdfYoVd",
        dropletParams: function (instanceId) {
            return {
                size_id: 66, // Smallest size
                image_id: 1000590,  // cc-snapshot1
                region_id: 2, // ams-1
                ssh_key_ids: "9792, 46554"
            }
        }
    },

    POLL_FREQUENCY: 5 * 1000, // Time between polling in ms
    PROVISION_FREQUENCY: 30 * 1000, // Time between provisioning checks in ms
    MIN_INSTANCES: 2, // Lower bound on number of instances provisioned
    MAX_INSTANCES: 5, // Upper bound on number of instances provisioned
    ALLOCATION_THRESHOLD: 8, // Average load
    DEALLOCATION_THRESHOLD: 2
};
