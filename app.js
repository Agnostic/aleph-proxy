var express = require('express'),
  app = express(),
  session = require('express-session'),
  axios = require('axios'),
  _ = require('underscore'),
  config = require('./config.json');

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
    res.end('Hi :)');
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

app.get('/api/pulls', function(req, res) {
  var repoUrl = '/repos/';

  // TODO(gilberto)
  // Move this validation before this route callback
  if (!req.session.accessToken) {
    res.status(401).json({
      error: 'unauthorized'
    });
  } else {

    if (req.query.user) {
      repoUrl += req.query.user;
    }

    if (req.query.repo) {
      repoUrl += '/' + req.query.repo;
    }

    axios({
      url: config.apiUrl + repoUrl + '/pulls?access_token=' + req.session.accessToken,
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'application/json'
      }
    }).then(function(response) {
      var pulls = [],
        commentsRequests = [],
        data = response.data;

      _.each(data, function(pr) {
        var reviewers = pr.body.match(/@wepow\/\w+/);

        if (reviewers) {
          reviewers = reviewers[0].replace('@wepow/', '');

          if (_.contains(req.session.teams, reviewers.toLowerCase())) {
            pulls.push({
              id: pr.id,
              url: pr.html_url,
              title: pr.title,
              body: pr.body,
              author: {
                name: pr.user.login,
                url: pr.user.html_url,
                avatar: pr.user.avatar_url
              },
              created_at: pr.created_at,
              comments: []
            });

            commentsRequests.push(pr.comments_url);
          }
        }
      });

      if (commentsRequests.length) {
        axios.all(commentsRequests.map(function(request) {
          return axios.get(request + '?access_token=' + req.session.accessToken);
        })).then(function(responses) {

          responses.forEach(function(response) {
            var data = response.data;

            if (!data || !data.length) return;

            var pr = _.find(pulls, function(pull) {
              return pull.url.match(/[0-9]+$/)[0] === data[0].html_url.match(/\/([0-9]+)#/)[1];
            });

            if (pr) {
              pr.comments = data.map(function(comment) {
                return {
                  user: comment.user.login,
                  avatar: comment.user.avatar_url,
                  comment: comment.body,
                  created_at: comment.created_at
                };
              });
            }
          });

          res.json(pulls);
        });
      } else {
        res.json(pulls);
      }

    });
  }
});

app.listen(process.env.PORT || 5000);
