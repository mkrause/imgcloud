
/*
 * GET home page.
 */

exports.index = function(req, res){
    console.log(req.cookies);
  res.render('index', { title: 'Express' });
};