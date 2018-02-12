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
          response.handleSuccess(res, result[lan], 200, 'Fetched info page');
        } else {
          response.handleSuccess(res, null, 404, 'Info page "' + page +'" not found');
        }
      });
    });
  }
}