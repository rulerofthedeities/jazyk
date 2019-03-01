'use strict';

const response = require('../response'),
      ErrorModel = require('../models/error');

module.exports = {
  addError: (req, res) => {
    const error = new ErrorModel(req.body);

    error.save((err, result) => {
      response.handleError(err, res, 500, 'Error adding error', () => {
        response.handleSuccess(res, result);
      });
    });
  }
}
