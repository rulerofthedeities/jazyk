const response = require('../response'),
      mongoose = require('mongoose'),
      Translation = require('../models/translation');


module.exports = {
  getTranslations: function(req, res) {
    const pipeline = [
      {$match: {components: req.params.component}},
      {$project:{_id:0, key:1, txt:'$' + req.params.lan}}
    ];

    Translation.aggregate(pipeline, function(err, docs) {
      response.handleError(err, res, 500, 'Error fetching translations', function(){
        response.handleSuccess(res, docs, 200, 'Fetched translations');
      });
    });
  }
}
