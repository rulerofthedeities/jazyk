const response = require('../response'),
      mongoose = require('mongoose'),
      WordPair = require('../models/wordpair');

module.exports = {
  getWordPairs: function(req, res) {
    const query = req.query;
    const word = query.isFromStart === 'true' ? "^" + query.word : query.word;
    const lan = query.languageId.slice(0, 2);
    const lanpair = query.languagePair;
    const key = lan + '.word';

    WordPair.find({langPair: lanpair, [key]:{$regex: word, $options:'i'}}, {}, {limit:10}, function(err, wordpairs) {
      response.handleError(err, res, 500, 'Error fetching wordpairs', function(){
        // Count workaround until v3.4 (aggregate)
        WordPair.count({langPair: lanpair, [key]:{$regex: word, $options:'i'}}, function(err, total) {
          response.handleError(err, res, 500, 'Error fetching wordpairs total', function(){
            response.handleSuccess(res, {wordpairs, total}, 200, 'Fetched wordpairs');
          });
        });
      });
    });
  },
  getWordPair: function(req, res) {
    const wordpairId = new mongoose.Types.ObjectId(req.params.id);
    WordPair.findOne({_id: wordpairId}, {}, function(err, wordpair) {
      response.handleError(err, res, 500, 'Error fetching wordpair', function(){
        response.handleSuccess(res, wordpair, 200, 'Fetched wordpair');
      });
    });
  }
}
