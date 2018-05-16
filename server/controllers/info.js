const response = require('../response'),
      mongoose = require('mongoose'),
      Page = require('../models/page');

module.exports = {
  getPage: function(req, res) {
    const page = req.params.page,
          lan = req.params.lan,
          query = {
            tpe:'info',
            name: page,
            lan: lan
          };
    Page.findOne(query, function(err, result) {
      response.handleError(err, res, 400, 'Error getting info page "' + page +'"', function() {
        response.handleSuccess(res, result);
      });
    });
  }
}