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
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

// Error handling
app.use(function (err, req, res, next) {
    if (!err) return next();

    res.render('error', {title: 'Error', error: err})
});

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
app.post('/images/upload', images.upload);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

