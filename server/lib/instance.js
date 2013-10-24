
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
    
    this.isRunning = function() {
        return this.state == this.STATES.RUNNING;
    };
    
    this.isDead = function() {
        return this.state == this.STATES.DEAD;
    };
    
    this.notifyAlive = function() {
        this.state = this.STATES.RUNNING;
    };
    
    this.notifyDead = function() {
        this.state = this.STATES.DEAD;
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
