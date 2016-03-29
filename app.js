var express = require('express'),
  app = express(),
  session = require('express-session'),
  request = require('request'),
  config = {
    authorizeUrl: 'https://github.com/login/oauth/authorize?client_id=d3d7cbd7dce23dd9de98&scope=user,repo',
    githubUrl: 'https://github.com',
    apiUrl: 'https://api.github.com',
    userAgent: 'wepow-app',
    clientSecret: '808ec362dbf485cb5ccd3bb34652d2e080e98217',
    clientId: 'd3d7cbd7dce23dd9de98'
  };

// Middlewares
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: '(*96sdS654%(()^))',
  cookie: { maxAge: 60000 }
}));

// Template engine
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res) {
  if (req.session.accessToken) {
    request({
      url: config.apiUrl + '/orgs/wepow/repos?access_token=' + req.session.accessToken,
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'application/json'
      }
    }, function(error, response, body) {
      res.json(JSON.parse(body));
      // res.end(req.session.accessToken);
    });
  } else {
    res.redirect('/auth');
  }
});

app.get('/auth', function(req, res) {
  if (req.query.code) {
    request({
      url: config.githubUrl + '/login/oauth/access_token',
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      qs: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: req.query.code
      }
    }, function(error, response, body) {
      var response = JSON.parse(body);

      if (response.error) {
        res.redirect(config.authorizeUrl);
      } else {
        req.session.accessToken = response.access_token;
        res.redirect('/');
      }
    });
  } else {
    res.redirect(config.authorizeUrl);
  }
});

app.get('/api', function(req, res) {
  res.end('It works :)');
});

app.listen(process.env.PORT || 5000);
