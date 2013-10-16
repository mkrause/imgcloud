module.exports = function Instance(host, port, load) {
    this.host = host;
    this.port = port;
    this.load = load;

    this.toString = function() {
        return "[" + host + ":" + port + ", " + load + "]";
    }
}
