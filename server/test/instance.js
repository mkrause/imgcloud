var Instance = require('../lib/instance');
var instances = [
    { host: "localhost", port: "3000" },
    { host: "localhost", port: "3001" }
];

var should = require('should');
describe('Instance', function(){
    var instance = new Instance(42, instances[0].host, instances[0].port);
    
    describe('#equals()', function() {
        it('should be equal to itself', function() {
            instance.equals(instance).should.be.ok;
        });

        it('should be equal to a different instance with the same host and port', function() {
            instance.equals(instances[0]).should.be.ok;
        });

        it('should not be equal to a different instance', function( ){
            instance.equals(instances[1]).should.not.be.ok;
        });
    });
});
