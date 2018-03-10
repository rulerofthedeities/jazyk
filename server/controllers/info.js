const response = require('../response'),
      mongoose = require('mongoose'),
      Info = require('../models/info');

module.exports = {
  getPage: function(req, res) {
    const page = req.params.page,
          lan = req.params.lan,
          query = {name:page};
    Info.findOne(query, function(err, result) {
      response.handleError(err, res, 400, 'Error getting info page "' + page +'"', function() {
        if (result && result[lan]) {
          response.handleSuccess(res, result[lan]);
        } else {
          response.handleSuccess(res, null);
        }
      });
    });
  }
}