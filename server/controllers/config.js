const response = require('../response'),
      mongoose = require('mongoose'),
      Config = require('../models/lanconfig');

module.exports = {
  getLanConfig: function(req, res) {
    const lanCode = req.params.lan;
    Config.findOne({tpe:'language', code: lanCode}, {}, function(err, config) {
      response.handleError(err, res, 500, 'Error fetching lan config', function(){
        response.handleSuccess(res, config, 200, 'Fetched lan config');
      });
    });
  }
}
