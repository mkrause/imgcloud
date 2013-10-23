// Get the average of a numerical array
function average(arr) {
    var sum = arr.reduce(function(prev, cur) {
        return prev + cur;
    }, 0);
    
    var avg;
    if (arr.length == 0) {
        avg = 0;
    } else {
        avg = sum / arr.length;
    }
    
    return avg;
}

module.exports = function Instance(id, host, port) {
    this.id = id;
    this.host = host;
    this.port = port;
    
    this.LOAD_HISTORY_WINDOW_SIZE = 30;//parseInt(this.PROVISION_FREQUENCY / this.POLL_FREQUENCY, 10);
    this.loadHistory = [];
    
    // Record the given load in our sliding window history
    this.recordLoad = function(load) {
        // Remove the first element, if we've exceeded the window size
        if (this.loadHistory.length >= this.LOAD_HISTORY_WINDOW_SIZE) {
            this.loadHistory.shift();
        }
        
        this.loadHistory.push(load);
    };
    
    this.averageLoad = function() {
        return average(this.loadHistory);
    };
    
    this.toString = function() {
        return "["
            + this.id + ", "
            + this.host + ":"
            + this.port + ", "
            + this.averageLoad()
            + "]";
    };
    
    this.equals = function(other) {
        return this.host == other.host && this.port == other.port;
    };
};
