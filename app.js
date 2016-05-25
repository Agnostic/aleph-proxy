var express = require('express'),
  app = express(),
  session = require('express-session'),
  axios = require('axios'),
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
    res.end();
    // res.render('pulls');
  } else {
    res.redirect('/auth');
  }
});

app.get('/auth', function(req, res) {
  req.session.regenerate(function() {

    if (req.query.code) {
      axios({
        url: config.githubUrl + '/login/oauth/access_token',
        method: 'post',
        headers: {
          Accept: 'application/json'
        },
        params: {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: req.query.code
        }
      }).then(function(response) {
        var data = response.data;

        if (data.error) {
          res.redirect(config.authorizeUrl);
        } else {
          req.session.accessToken = data.access_token;

          // Get user teams
          axios({
            url: config.apiUrl + '/user/teams?access_token=' + req.session.accessToken,
            headers: {
              'User-Agent': config.userAgent,
              Accept: 'application/json'
            }
          }).then(function(response) {
            var teams = [],
              data = response.data || [];

            for (var i = 0; i < data.length; i++) {
              teams.push(data[i].name.toLowerCase());
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

app.get('/api/comments', function(req, res) {
  var url = req.query.url;
  axios({
    url: url + '?access_token=' + req.session.accessToken,
    headers: {
      'User-Agent': config.userAgent,
      Accept: 'application/json'
    }
  }).then(function(response) {
    res.json(response.data);
  });
});

app.get('/api/pulls', function(req, res) {
  if (!req.session.accessToken) {
    res.status(401).json({
      error: 'unauthorized'
    });
  } else {
    request({
      url: config.apiUrl + '/repos/wepow/wepow-app/pulls?access_token=' + req.session.accessToken,
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'application/json'
      }
    }, function(response) {
      var pulls = [],
        data = response.data;

      _.each(data, function(pr) {
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
  }
});

app.listen(process.env.PORT || 5000);
