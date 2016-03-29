var express = require('express'),
  app = express();

app.get('/', function(req, res) {
  res.end('It works :)');
});

app.listen(80);
