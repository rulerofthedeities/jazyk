const response = require('../response'),
      Log = require('../models/log');

module.exports = {
  logPage: function(req, res) {
    const page = 'test'; // req.body.page,
          currentTime = new Date(),
          query = {
            page,
            year: currentTime.getFullYear(),
            month: currentTime.getMonth() + 1,
            day: currentTime.getDate()
          },
          update = {
            $inc: {count: 1}
          };
    console.log('logging', query);
    Log.findOneAndUpdate(query, update, {upsert: true})
    .then((result) => {
      console.log('result', result);
      response.handleSuccess(res, result);
    }).catch((err) => {
      console.log('error', err);
      response.handleError(err, res, 400, 'Error updating page log');
    });
  }
}
