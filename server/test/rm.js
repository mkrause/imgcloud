var ResourceManager = require('../lib/rm');
var Instance = require('../lib/instance');
var instances = [
    { host: "localhost", port: "3000" },
    { host: "localhost", port: "3001" }
];

var should = require('should');
describe('ResourceManager', function(){
    var rm = new ResourceManager();

    beforeEach(function() {
        rm.bootstrap(instances);
    });

    describe('#markInstanceDead()', function(){
        it('should remove the first instance from the list of instances', function(){
            rm.markInstanceDead(instances[0]);
            rm.getInstances().length.should.equal(1);
        });

        it('should remove the second instance from the list of instances', function(){
            rm.markInstanceDead(instances[1]);
            rm.getInstances().length.should.equal(1);
        });

        it('should remove both instances from the list of instances', function(){
            rm.markInstanceDead(instances[0]);
            rm.markInstanceDead(instances[1]);
            rm.getInstances().length.should.equal(0);
        });

        it("shouldn't remove any instances if an invalid value is provided", function() {
            rm.markInstanceDead({});
            rm.getInstances().length.should.equal(2);
        });
    })
})