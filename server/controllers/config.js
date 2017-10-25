const response = require('../response'),
      mongoose = require('mongoose'),
      Config = require('../models/lanconfig');

module.exports = {
  getLanConfig: function(req, res) {
    const lanCode = req.params.lan,
          query = {tpe:'language', code: lanCode};
    Config.findOne(query, function(err, config) {
      response.handleError(err, res, 500, 'Error fetching lan config', function(){
        response.handleSuccess(res, config, 200, 'Fetched lan config');
      });
    });
  },
  getWelcomeMessage: function(req, res) {
    const lanCode = req.params.lan,
          query = {tpe:'notification', code: lanCode, name: 'welcome'},
          projection = {_id: 0, title: 1, message: 1};
    console.log('getting welcome message', query, projection);
    Config.findOne(query, projection, function(err, message) {
      response.handleError(err, res, 500, 'Error fetching notification message', function(){
        console.log('welcome message', message);
        response.handleSuccess(res, message, 200, 'Fetched notification message');
      });
    });
  }
}
