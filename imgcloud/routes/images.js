var os = require('os');
var crypto = require('crypto');
var fs = require('fs');

/*
 * POST image
 */
exports.upload = function (req, res) {
    console.log("Received image upload");
    var options = req.body.processing;
    if(!(options instanceof Array)) {
        options = [options];
    }
    if(req.files.image == 'undefined' || req.files.image.size == 0) {
        throw new Error("No file provided");
    }
    processImage(req.files.image, options, res);
};


// Either use GraphicsMagick (fast) or ImageMagick (slow)
var gm = require('gm');
var imageMagick = gm.subClass({ imageMagick: true });
var engine = gm;
var fs = require('fs');

var OPTIONS = {
    noise: function () {
        return this.noise(2);
    },
    despeckle: function () {
        return this.despeckle();
    },
    motionBlur: function () {
        return this.motionBlur(0, 30, 90);
    },
    flip: function () {
        return this.flip();
    },
    resize: function () {
        return this.resize(640, 480);
    }
}

function processImage(file, options, res) {
    var shasum = crypto.createHash('md5');

    var s = fs.ReadStream(file.path);
    s.on('data', function(d) {
        shasum.update(d);
    });

    s.on('end', function() {
        var d = shasum.digest('hex');
        var fname = file.name.split('.');
        var filename = d + options.sort().join(".") + "." + fname[fname.length - 1];

        fs.exists(filename, function(exists) {
            if(exists) {
                // Render cached file
                renderFile(filename, res);
            } else {
                // Perform calculations
                var image = engine(file.path);
                image.autoOrient();

                options.forEach(function (option) {
                    if (OPTIONS[option]) {
                        image = OPTIONS[option].call(image);
                    }
                });

                image.write(filename, function (err) {
                    if (err) {
                        renderError(res, err);
                    } else {
                        renderFile(filename, res);
                    }
                });
            }
        });
    });
}

function renderFile(file, res) {
    fs.readFile(file, function (err, data) {
        if (err) {
            renderError(res, err);
        } else {
            res.attachment(file);
            res.send(data);
        }
    });
}

function renderError(res, err) {
    res.render('error', {title: 'Error', error: err})
}
