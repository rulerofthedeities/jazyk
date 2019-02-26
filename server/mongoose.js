const uriFormat = require('mongodb-uri');
var mongoose = require('mongoose'),
    db_url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/km-jazyk',
    options = {
      autoIndex: true,
      keepAlive: 1,
      connectTimeoutMS: 30000,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 500,
      poolSize: 10,
      promiseLibrary: global.Promise,
      useCreateIndex: true,
      useNewUrlParser: true
    };

function encodeMongoURI(urlString) {
  if (urlString) {
    let parsed = uriFormat.parse(urlString);
    urlString = uriFormat.format(parsed);
  }
  return urlString;
}

mongoose.Promise = global.Promise;
mongoose.connect(encodeMongoURI(db_url), options)
.then(() => {
  console.log('Connected to database.');
})
.catch(() => {
  console.log('Error connecting to database.');
});

module.exports = {mongoose};
