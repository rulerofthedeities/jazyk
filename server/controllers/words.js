const response = require('../response'),
      mongoose = require('mongoose'),
      WordPair = require('../models/wordpair'),
      WordDetail = require('../models/worddetail');

getDetail= function(word, callback) {
  let detail = null;
  if (word && word.detailId) {
    WordDetail.findOne({_id: word.detailId}, {}, function(err, worddetail) {
      callback(err, worddetail);
    });
  } else {
    callback(null, detail);
  }
}

module.exports = {
  getWordPairs: function(req, res) {
    const params = req.query,
          getTotal = params.getTotal === 'true' ? true : false;
          limit = parseInt(params.limit, 10) > 0 ? parseInt(params.limit, 10) : 250,
          forceFromStart = params.word.length < 4 ? true : false,
          word = params.isFromStart === 'true' || forceFromStart ? "^" + params.word : params.word,
          lanpair = params.languagePair.split(';'),
          key =  params.languageId + '.word',
          forceExact = params.word.length < 3 ? true : false,
          search = params.isExact === 'true' || forceExact ? params.word : {$regex: word, $options:'i'},
          query = {
            docTpe:'wordpair',
            $and:[{lanPair: lanpair[0]}, {lanPair: lanpair[1]}],
            [key]:search
          };
    WordPair.find(query, {}, {limit}, function(err, wordpairs) {
      response.handleError(err, res, 500, 'Error fetching wordpairs', function() {
        // Count workaround until v3.4 (aggregate)
        if (query.getTotal === 'true') {
          WordPair.count(q, function(err, total) {
            response.handleError(err, res, 500, 'Error fetching wordpairs total', function() {
              response.handleSuccess(res, {wordpairs, total}, 200, 'Fetched wordpairs');
            });
          });
        } else {
          response.handleSuccess(res, wordpairs, 200, 'Fetched wordpairs');
        }
      });
    });
  },
  getWordPairDetail: function(req, res) {
    const wordpairId = new mongoose.Types.ObjectId(req.params.wordpairId);
    WordPair.findOne({_id: wordpairId}, {}, function(err, wordpair) {
      //get detail docs
      languages = wordpair.lanPair;
      getDetail(wordpair[languages[0]], function(err, detail0) {
        getDetail(wordpair[languages[1]], function(err, detail1) {
          words = {wordPair:wordpair, [languages[0]]:detail0, [languages[1]]:detail1};
          response.handleError(err, res, 500, 'Error fetching wordpair details', function(){
            response.handleSuccess(res, words, 200, 'Fetched wordpair details');
          });
        });
      });
    });
  },
  getWordDetailMedia: function(req, res) {
    const wordDetailId = new mongoose.Types.ObjectId(req.params.wordpairId);
    WordDetail.findOne({_id: wordDetailId}, {audios:1, images:1}, function(err, media) {
      response.handleError(err, res, 500, 'Error fetching detail media', function(){
        response.handleSuccess(res, media, 200, 'Fetched detail media');
      });
    });
  }
}
