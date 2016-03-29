var express = require('express'),
  app = express(),
  session = require('express-session'),
  request = require('request'),
  _ = require('underscore'),
  config = {
    authorizeUrl: 'https://github.com/login/oauth/authorize?client_id=d3d7cbd7dce23dd9de98&scope=user,repo',
    githubUrl: 'https://github.com',
    apiUrl: 'https://api.github.com',
    userAgent: 'wepow-app',
    clientSecret: '808ec362dbf485cb5ccd3bb34652d2e080e98217',
    clientId: 'd3d7cbd7dce23dd9de98'
  };

// Middlewares
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
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
      url: config.apiUrl + '/repos/wepow/wepow-app/pulls?access_token=' + req.session.accessToken,
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'application/json'
      }
    }, function(error, response, body) {
      var pulls = [];

      _.each(JSON.parse(body), function(pr) {
        var reviewers = pr.body.match(/@wepow\/\w+/);

        if (reviewers) {
          reviewers = reviewers[0].replace('@wepow/', '');

          if (_.contains(req.session.teams, reviewers.toLowerCase())) {
            pulls.push({
              url: pr.html_url,
              title: pr.title,
              body: pr.body,
              author: {
                name: pr.user.login,
                url: pr.user.html_url,
                avatar: pr.user.avatar_url
              },
              created_at: pr.created_at,
              comments_url: pr.comments_url
            });
          }
        }
      });

      res.json(pulls);
    });
  } else {
    res.redirect('/auth');
  }
});

app.get('/auth', function(req, res) {
  req.session.regenerate(function() {

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

          // Get user teams
          request({
            url: config.apiUrl + '/user/teams?access_token=' + req.session.accessToken,
            headers: {
              'User-Agent': config.userAgent,
              Accept: 'application/json'
            }
          }, function(error, response, body) {
            var teams = [],
              response = [];

            try {
              response = JSON.parse(body);
            } catch(e) {}

            for (var i = 0; i < response.length; i++) {
              teams.push(response[i].name.toLowerCase());
            }

            req.session.teams = teams;
            res.redirect('/');
          });
        }
      });
    } else {
      res.redirect(config.authorizeUrl);
    }

  });
});

app.get('/api', function(req, res) {
  res.end('It works :)');
});

app.listen(process.env.PORT || 5000);
