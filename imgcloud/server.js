/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var images = require('./routes/images');

var http = require('http');
var path = require('path');
var partials = require('express-partials');

var app = express();

// all environments
app.set('port', process.env.PORT || process.argv[2] || 8001);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

// Ignore the /favicon.ico
app.use(express.favicon());

// Custom middleware
app.use(setSystemLoad);

// Error handling
app.use(function (err, req, res, next) {
    if (!err) return next();

    res.render('error', {title: 'Error', error: err});
});

// Routing
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', routes.index);
app.get('/ping', routes.ping);
app.get('/stats', routes.stats);
app.post('/images/upload', images.upload);

// Start
var port = app.get('port');
console.log("Starting instance on port " + port);
http.createServer(app).listen(port, function () {
    console.log('Express server listening on port ' + port);
});

var os = require('os');
function setSystemLoad(req, res, next) {
    res.set("x-imgcloud-osload", os.loadavg()[0]);
    res.set("x-imgcloud-host", req.headers['x-imgcloud-host']);
    res.set("x-imgcloud-start-lb", req.headers['x-imgcloud-start-lb']);
    res.set("x-imgcloud-start-app", +new Date);

    res.cookie("imgcloud-host", req.headers["x-imgcloud-host"]);
    next();
}