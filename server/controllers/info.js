const response = require('../response'),
      Page = require('../models/page');

module.exports = {
  getPage: function(req, res) {
    const page = req.params.page,
          lan = req.params.lan,
          loggedIn = req.params.loggedIn,
          query = {
            tpe:'info',
            name: page,
            lan: lan
          };
    if (loggedIn === 'true') {
      query.loggedIn = true;
    } else {
      query.loggedOut = true;
    }
    Page.findOne(query, function(err, result) {
      response.handleError(err, res, 400, 'Error getting info page "' + page +'"', function() {
        response.handleSuccess(res, result);
      });
    });
  }
}
