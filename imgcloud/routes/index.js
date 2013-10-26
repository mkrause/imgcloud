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

/**
 * Statistics endpoint, accessible through /stats, with optional ?from=12:35:45 time filter
 */
exports.stats = function (req, res) {
    var DB = redis.createClient();
    var stats = {};

    var strToTime = function(timeString) {
        date = new Date;
        date.setHours(timeString.split(":")[0]);
        date.setMinutes(timeString.split(":")[1]);
        date.setSeconds(timeString.split(":")[2]);
        return date;
    }

    var fromTime;
    if(req.query["from"]) {
        fromTime = strToTime(req.query["from"]);
    }

    DB.keys("imgcloud-*").then(function (keys) {
        var filtered_keys = keys.filter(function(value) {
            var fragments = value.split("-");
            var time = true;
            if(fromTime) {
                time = strToTime(fragments[3]) > fromTime;
            }
            return time && ["osload", "response"].indexOf(fragments[1]) != -1;
        });
        DB.send("mget", filtered_keys).then(function (values) {
            for (var i = 0; i < filtered_keys.length; i++) {
                var key = filtered_keys[i].split("-");
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