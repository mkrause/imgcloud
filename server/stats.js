var redis = require("then-redis");
var DB = redis.createClient();
var stats = {};

var strToTime = function(timeString) {
    date = new Date;
    date.setHours(timeString.split(":")[0]);
    date.setMinutes(timeString.split(":")[1]);
    date.setSeconds(timeString.split(":")[2]);
    return date;
}

DB.keys("imgcloud-*").then(function (keys) {
    var filtered_keys = keys;

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
        console.log(JSON.stringify(stats));
        process.exit(0);
    });
});
