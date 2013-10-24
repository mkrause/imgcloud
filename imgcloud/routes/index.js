var os = require('os');
var redis = require("then-redis");

/*
 * GET home page.
 */
exports.index = function (req, res) {
    res.render('index', { title: 'imgCloud' });
};

exports.ping = function (req, res) {
    res.send('200')
};

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

exports.stats = function(req, res) {
    var DB = redis.createClient();

    var os_loads = {};

    DB.keys("imgcloud-osload-*").then(function(keys) {
        DB.send("mget", keys).then(function(values) {
            for(var i=0; i < keys.length; i++) {
                var key = keys[i].split("-");
                var instance = key[2];
                var time = key[3];

                if(!os_loads[time]) {
                    os_loads[time] = {}
                }
                os_loads[time][instance] = values[i];
            }

            console.log(os_loads);

            res.write(JSON.stringify(os_loads));
            res.end();
        });
    });
    var response_time_keys = DB.keys("imgcloud-response-*");
};