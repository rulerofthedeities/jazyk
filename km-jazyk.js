'use strict';
var express = require('express'),
    app = express(),
    compression = require('compression'),
    path = require('path'),
    bodyParser = require('body-parser'),
    bearerToken  = require('express-bearer-token'),
    fs = require('fs'),
    routes = require('./server/routes'),
    checks = require('./server/checks'),
    {mongoose} = require('./server/mongoose'),
    https = require('https');

// config
app.set('port', process.env.PORT || 4801);
app.set('env', process.env.NODE_ENV || 'development');
app.set('token_expiration', 604800);// Token expires after 7 days

// check for warnings
checks.checkWarnings(app);

// middleware
app.use(compression());
app.use(bearerToken());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// routing
routes.initialize(app, new express.Router());

// server
if (app.get('env') === 'development') {

  const options = {
    key: fs.readFileSync('../ssl/jazyk.key'),
    cert: fs.readFileSync('../ssl/jazyk.cer')
  };
  https.createServer(options, app).listen(app.get('port'), function() {
    console.log('Local https server running on port ' + app.get('port'));
  });
} else {
  app.listen(app.get('port'), function() {
    console.log('Server running on port ' + app.get('port'));
  });
}
