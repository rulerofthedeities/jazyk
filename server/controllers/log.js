'use strict';

const response = require('../response'),
      Log = require('../models/log'),
      ErrorModel = require('../models/error');

module.exports = {
  logPage: (req, res) => {
    const page = req.body.page,
          currentTime = new Date(),
          query = {
            page,
            year: currentTime.getFullYear(),
            month: currentTime.getMonth() + 1,
            day: currentTime.getDate()
          },
          update = {
            $inc: {count: 1},
            $set: {dt: currentTime}
          };
    Log.findOneAndUpdate(query, update, {upsert: true})
    .then((result) => {
      response.handleSuccess(res, result);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error updating page log');
    });
  },
  logError: (err, code, src, msg, module) => {
    if (err) {
      const error = new ErrorModel({
        code,
        src,
        msg,
        module,
        err
      });
      error.save((err, result) => {});
    }
  }
}
