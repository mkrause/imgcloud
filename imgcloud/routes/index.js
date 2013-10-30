var redis = require("then-redis");
var DB = redis.createClient();
var _ = require('underscore');

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
    DB.keys("imgcloud-*").then(function (keys) {
        DB.send("mget", keys).then(function (values) {
            var stats = {};

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i].split("-");
                var instance = key[2];
                var time = key[3];

                if (!stats[key[1]]) {
                    stats[key[1]] = {};
                }
                if (!stats[key[1]][time]) {
                    stats[key[1]][time] = {};
                }

                stats[key[1]][time][instance] = values[i];
            }

            var output = {};
            output.title = "System statistics";
            output.system_load = _.last(_.values(stats["systemload"]))['0'];
            output.response = _.last(_.values(_.last(_.values(stats["response"]))));

            var last_stats = _.last(_.pairs(stats["instanceload"]));
            output.users = _.values(last_stats[1]).reduce(function (a, b) {
                return parseInt(a) + parseInt(b);
            });

            output.instance_loads = last_stats[1];

            console.log("last stats");
            console.log(last_stats[1]);

            output.instances = last_stats.length;
            output._ = _;

            res.render('stats', output);
        });
    });
};

