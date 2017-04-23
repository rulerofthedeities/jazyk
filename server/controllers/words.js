const response = require('../response'),
      mongoose = require('mongoose'),
      WordPair = require('../models/wordpair'),
      WordDetail = require('../models/worddetail');

getDetail= function(word, callback) {
  let detail = null;
  if (word.detailId) {
    WordDetail.findOne({_id: word.detailId}, {}, function(err, worddetail) {
      callback(err, worddetail);
    });
  } else {
    callback(null, detail);
  }
}

module.exports = {
  getWordPairs: function(req, res) {
    const query = req.query;
    const word = query.isFromStart === 'true' ? "^" + query.word : query.word;
    const lan = query.languageId.slice(0, 2);
    const lanpair = query.languagePair;
    const key = lan + '.word';
    const search = query.isExact === 'true' ? query.word : {$regex: word, $options:'i'};

    WordPair.find({langPair: lanpair, [key]:search}, {}, {limit: 50, sort:{[key]:1}}, function(err, wordpairs) {
      response.handleError(err, res, 500, 'Error fetching wordpairs', function(){
        // Count workaround until v3.4 (aggregate)
        WordPair.count({langPair: lanpair, [key]:search}, function(err, total) {
          response.handleError(err, res, 500, 'Error fetching wordpairs total', function(){
            response.handleSuccess(res, {wordpairs, total}, 200, 'Fetched wordpairs');
          });
        });
      });
    });
  },
  getWordPairDetail: function(req, res) {
    const wordpairId = new mongoose.Types.ObjectId(req.params.id);
    WordPair.findOne({_id: wordpairId}, {}, function(err, wordpair) {
      //get detail docs
      languages = [];
      languages[0] = wordpair.langPair.slice(0, 2);
      languages[1] = wordpair.langPair.slice(2);
      getDetail(wordpair[languages[0]], function(err, detail0) {
        getDetail(wordpair[languages[1]], function(err, detail1) {
          words = {wordPair:wordpair, [languages[0]]:detail0, [languages[1]]:detail1};
          response.handleError(err, res, 500, 'Error fetching wordpair', function(){
            response.handleSuccess(res, words, 200, 'Fetched wordpair');
          });
        });
      });

    });
  }
}
