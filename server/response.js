'use strict';

module.exports = {
  handleError: (err, res, statusno, title, callback) => {
    if (err && res) {
      return res.status(statusno).json({
        title: title,
        error: err
      });
    } else {
      callback();
    }
  },
  handleSuccess: (res, result) => {
    res.status(200).send(result);
    result = null;
  }
}
