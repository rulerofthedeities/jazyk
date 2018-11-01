const mongoose = require('mongoose'),
      uriFormat = require('mongodb-uri'),
      fs = require('fs'),
      https = require('https'),
      http = require('http'),
      db_url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/km-jazyk',
      options = {
        autoIndex: true,
        keepAlive: 1,
        connectTimeoutMS: 30000,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 500,
        poolSize: 10,
        promiseLibrary: global.Promise
      };

function encodeMongoURI(urlString) {
  if (urlString) {
    let parsed = uriFormat.parse(urlString);
    urlString = uriFormat.format(parsed);
  }
  return urlString;
}

module.exports = {
  runServer: (app, callback) => {
    mongoose.Promise = global.Promise;
    // Connect to database
    mongoose.connect(encodeMongoURI(db_url), options)
    .then(() => {
      console.log(`Connected to db at ${db_url}.`);
      // Start server
      if (app.get('env') === 'development') {
        const options = {
          key: fs.readFileSync('../ssl/jazyk.key'),
          cert: fs.readFileSync('../ssl/jazyk.cer')
        };
        https.createServer(options, app).listen(app.get('port'), () => {
          console.log('Local https server running on port ' + app.get('port'));
          if (callback) {
            callback();
          }
        });
        // FOR TESTING ONLY !!!
        http.createServer(app).listen((app.get('port') + 1), () => {
          console.log('Local http server running on port ' + (app.get('port') + 1));
          if (callback) {
            callback();
          }
        });
      } else {
        app.listen(app.get('port'), () => {
          console.log('Server running on port ' + app.get('port'));
          if (callback) {
            callback();
          }
        });
      }
    })
    .catch((err) => {
      console.log('Error connecting to database.');
      if (callback) {
        return callback(err);
      }
    });
  }
}
