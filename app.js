var express = require('express'),
  app = express(),
  request = require('request'),
  config = {
    githubUrl: 'https://github.com',
    clientSecret: '808ec362dbf485cb5ccd3bb34652d2e080e98217',
    clientId: 'd3d7cbd7dce23dd9de98'
  };

// Static assets
app.use(express.static(__dirname + '/public'));

// Template engine
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/auth', function(req, res) {
  if (req.query.code) {
    request({
      url: config.githubUrl + '/login/oauth/access_token',
      method: 'POST',
      qs: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: req.query.code
      }
    }, function(error, response, body) {
      res.end(body);
    });
  } else {
    res.redirect('/');
  }
});

app.get('/api', function(req, res) {
  res.end('It works :)');
});

app.listen(process.env.PORT || 5000);
