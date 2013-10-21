var os = require('os');

/*
 * GET home page.
 */
exports.index = function (req, res) {
    res.set("X-imgcloud-load", os.loadavg());
    res.cookie("imgcloud-host", req.headers.host);
    res.render('index', { title: 'imgCloud' });
};

exports.ping = function (req, res) {
    res.send('200')
};