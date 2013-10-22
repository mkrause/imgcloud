module.exports = function Instance(id, host, port, load) {
    this.id = id;
    this.host = host;
    this.port = port;
    this.load = load;

    this.toString = function() {
        return "["
            + this.id + ":"
            + this.host + ", "
            + this.port + ", "
            + this.load
            + "]";
    }
    
    this.equals = function(other) {
        return this.host == other.host && this.port == other.port;
    }
}
