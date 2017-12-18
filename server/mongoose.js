var mongoose = require('mongoose'),
    db_url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/km-jazyk',
    options = {
      useMongoClient: true,
      autoIndex: false,
      keepAlive: 1,
      connectTimeoutMS: 30000,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 500,
      poolSize: 10,
      promiseLibrary: global.Promise
    };
mongoose.connect(db_url, options);

module.exports = {mongoose};
