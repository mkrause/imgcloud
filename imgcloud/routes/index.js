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

exports.stats = function (req, res) {
    var DB = redis.createClient();

    var stats = {};

    DB.keys("imgcloud-*").then(function (keys) {
        var filtered_keys = keys.filter(function(value) {
            var fragment = value.split("-")[1];
            return ["osload", "response"].indexOf(fragment) != -1;
        });
        DB.send("mget", filtered_keys).then(function (values) {
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i].split("-");
                var instance = key[2];
                var time = key[3];

                if(!stats[key[1]]) {
                    stats[key[1]] = {};
                }
                if (!stats[key[1]][time]) {
                    stats[key[1]][time] = {};
                }

                stats[key[1]][time][instance] = values[i];
            }

            res.write(JSON.stringify(stats));
            res.end();
        });
    });
};