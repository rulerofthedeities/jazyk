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
    const query = req.query,
          getTotal = query.getTotal === 'true' ? true : false;
          limit = parseInt(query.limit, 10) > 0 ? parseInt(query.limit, 10) : 50,
          word = query.isFromStart === 'true' ? "^" + query.word : query.word,
          lanpair = query.languagePair.split(';'),
          key =  query.languageId + '.word',
          search = query.isExact === 'true' ? query.word : {$regex: word, $options:'i'},
          q = {docTpe:'wordpair', $and:[{lanPair: lanpair[0]}, {lanPair: lanpair[1]}], [key]:search};

    WordPair.find(q, {}, {limit}, function(err, wordpairs) {
      response.handleError(err, res, 500, 'Error fetching wordpairs', function(){
        // Count workaround until v3.4 (aggregate)
        if (query.getTotal === 'true') {
          WordPair.count(q, function(err, total) {
            response.handleError(err, res, 500, 'Error fetching wordpairs total', function(){
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
    const wordpairId = new mongoose.Types.ObjectId(req.params.id);
    WordPair.findOne({_id: wordpairId}, {}, function(err, wordpair) {
      console.log('wordpair', wordpair);
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
    const wordDetailId = new mongoose.Types.ObjectId(req.params.id);
    WordDetail.findOne({_id: wordDetailId}, {audios:1, images:1}, function(err, media) {
      response.handleError(err, res, 500, 'Error fetching detail media', function(){
        response.handleSuccess(res, media, 200, 'Fetched detail media');
      });
    });
  }
}
