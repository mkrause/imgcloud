
module.exports = function Instance(id, host, port, load) {
    this.id = id;
    this.host = host;
    this.port = port;
    this.load = load || 0;
    
    this.STATES = {
        DEAD: 0,
        RUNNING: 1,
        STARTING: 2
    };
    
    this.state = this.STATES.STARTING;
    
    this.isStarting = function() {
        return this.state == this.STATES.STARTING;
    };
    
    this.notifyAlive = function() {
        this.state = 'alive';
    };
    
    this.notifyDead = function() {
        this.state = 'dead';
    };
    
    this.toString = function() {
        return "["
            + this.id + ", "
            + this.host + ":"
            + this.port + ", "
            + this.load
            + "]";
    };
    
    this.equals = function(other) {
        return this.host == other.host && this.port == other.port;
    };
};
