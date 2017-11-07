'use strict';
var express = require('express'),
    mongoose = require('mongoose'),
    app = express(),
    compression = require('compression'),
    path = require('path'),
    bodyParser = require('body-parser'),
    bearerToken  = require('express-bearer-token'),
    routes = require('./server/routes'),
    checks = require('./server/checks'),
    db_url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/km-jazyk';

//config
app.set('port', process.env.PORT || 4800);
app.set('env', process.env.NODE_ENV || 'development');
app.set('token_expiration', 604800);// Token expires after 7 days

checks.checkWarnings(app);

//middleware
app.use(compression());
app.use(bearerToken());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

//routing
routes.initialize(app, new express.Router());

//start server
var options = {
  server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};
mongoose.Promise = global.Promise;
mongoose.connect(db_url, options, function(err) {
  app.listen(app.get('port'), function() { 
    console.log('Server running on port ' + app.get('port'));
  });
});
