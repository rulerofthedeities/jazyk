'use strict';

module.exports = {
  handleError: function(err, res, statusno, title, callback) {
    if (err) {
      return res.status(statusno).json({
        title: title,
        error: err
      });
    } else {
      callback();
    }
  },
  handleSuccess: function(res, result) {
    res.status(200).send(result);
  }
}
