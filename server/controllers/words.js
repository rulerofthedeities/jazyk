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
        WordPair.count({langPair: lanpair, [key]:{$regex: word, $options:'i'}}, function(err, total) {
          response.handleError(err, res, 500, 'Error fetching wordpairs total', function(){
            response.handleSuccess(res, {wordpairs, total}, 200, 'Fetched wordpairs');
          });
        });
      });
    });

/*
    let pipeline = [];
    let match = {}, match2 = {};
    match[key] = {$exists:true};
    match2[key] = {$regex: word, $options:'i'};
    let project = {};
    project = {_id:1};
    project[key] = 1;

    pipeline.push({$match: match});
    pipeline.push({$unwind: '$' + lan});
    pipeline.push({$match: match2});
    pipeline.push({$project: project});
    pipeline.push({$limit: 10});
    //Version 3.4
    //pipeline.push({$count:"total"});

    WordPair.aggregate(pipeline, function(err, wordpairs) {
      response.handleError(err, res, 500, 'Error fetching wordpairs', function(){
        // Count workaround until v3.4
        WordPair.count(match2, function(err, total) {
          response.handleError(err, res, 500, 'Error fetching wordpairs total', function(){
            response.handleSuccess(res, {wordpairs, total}, 200, 'Fetched wordpairs');
          });
        });
      });
    });
    */
  },
  getWordPair: function(req, res) {
    const wordpairId = new mongoose.Types.ObjectId(req.params.id);
    console.log('wordpairid', wordpairId);
    WordPair.findOne({_id: wordpairId}, {}, function(err, lesson) {
      response.handleError(err, res, 500, 'Error fetching wordpair', function(){
        response.handleSuccess(res, lesson, 200, 'Fetched wordpair');
      });
    });
  }
}
