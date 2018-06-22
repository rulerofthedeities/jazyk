const response = require('../response'),
      mongoose = require('mongoose'),
      Log = require('../models/log');

module.exports = {
  logPage: function(req, res) {
    const page = req.body.page,
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
    Log.findOneAndUpdate(query, update, {upsert: true})
    .then((result) => {
      response.handleSuccess(res, result);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error updating page log');
    });
  }
}
