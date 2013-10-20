/*
 * POST image
 */
exports.upload = function (req, res) {
    processImage(req.files.image.path, ["motionBlur"], res);
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
    resize: function() {
        return this.resize(640, 480);
    }
}

function processImage(file, options, res) {
    var image = engine(file);
    image.autoOrient();

    options.forEach(function (option) {
        if (OPTIONS[option]) {
            image = OPTIONS[option].call(image);
        }
    });

    image.write(file + ".processed", function (err) {
        if (err) throw err;
        renderFile(file + ".processed", res);
    });
}

function renderFile(file, res) {
    fs.readFile(file, function (err, data) {
        if (err) throw err;
        res.write(data);
        res.end();
    });
}