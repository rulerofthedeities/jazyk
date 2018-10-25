const mongoose = require('mongoose'),
      uriFormat = require('mongodb-uri'),
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
      app.listen(app.get('port'), () => {
        console.log(`Listen to port ${app.get('port')}`);
        if (callback) {
          callback();
        }
      });
    })
    .catch((err) => {
      console.log('Error connecting to database.');
      if (callback) {
        return callback(err);
      }
    });
  }
}
