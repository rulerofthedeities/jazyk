const response = require('../response'),
      mongoose = require('mongoose'),
      ErrorModel = require('../models/error');


module.exports = {
  addError: function(req, res) {
    const error = new ErrorModel(req.body);

    error.save(function(err, result) {
      response.handleError(err, res, 500, 'Error adding error', function(){
        response.handleSuccess(res, result, 200, 'Added error');
      });
    });
  }
}
