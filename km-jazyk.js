'use strict';
var express = require('express'),
    app = express(),
    compression = require('compression'),
    path = require('path'),
    bodyParser = require('body-parser'),
    bearerToken  = require('express-bearer-token'),
    routes = require('./server/routes'),
    checks = require('./server/checks'),
    {mongoose} = require('./server/mongoose');

// config
app.set('port', process.env.PORT || 4800);
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
app.listen(app.get('port'), function() { 
  console.log('Server running on port ' + app.get('port'));
});
