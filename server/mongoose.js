var mongoose = require('mongoose'),
    db_url = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/km-jazyk',
    options = {
      server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
      replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
    };
mongoose.Promise = global.Promise;
mongoose.connect(db_url, options);

module.exports = {mongoose};
