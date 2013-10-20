
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'imgCloud' });
};

exports.ping = function(req, res) {
    res.send('200')
};