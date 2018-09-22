const response = require('../response'),
      mongoose = require('mongoose'),
      Session = require('../models/book').session;

const getTotalPoints = function(userId, cb) {
  const scoreBooksPipeline = [
          {$match: {userId}},
          {$group: {
            _id: null,
            totalPointsWords: {'$sum': '$points.words'},
            totalPointsTranslations: {'$sum': '$points.translations'},
            totalPointsFinished: {'$sum': '$points.finished'}
          }},
          {$project: {
            _id: 0,
            points: {'$add' : [ '$totalPointsWords', '$totalPointsTranslations', '$totalPointsFinished' ]}
          }}
        ];

  const getScores = async () => {
    const books = await Session.aggregate(scoreBooksPipeline);

    let score = 0;
    scoreBooks = books && books[0] ? books[0].points : 0;
    score = scoreBooks;
    return {score};
  };

  getScores().then((result) => {
    cb(null, result.score);
  }).catch((err) => {
    console.log(err);
    cb(err, null);
  });
}

module.exports = {
  getTotalScore: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id);
    getTotalPoints(userId, (err, score) => {
      response.handleError(err, res, 400, 'Error fetching total score', function(){
        response.handleSuccess(res, score.toString());
      });
    })
  },
  getBookScores: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          pipeline = [
            {$match: {userId}},
            {$group: {
              _id: {
                bookId: '$bookId',
                lan: '$lanCode'
              },
              totalPoints: {'$sum': { $add : [
                '$points.words',
                '$points.translations',
                '$points.finished']
              }}
            }},
            {$sort: {'totalPoints': -1}},
            {$lookup: {
              from: 'books',
              localField: '_id.bookId',
              foreignField: '_id',
              as: 'book'
            }},
            {$project: {
              _id: 1,
              book: 1,
              points: '$totalPoints'
            }}
          ];
    Session.aggregate(pipeline, function(err, result) {
      response.handleError(err, res, 400, 'Error fetching score per book', () => {
        let scores = [];
        let total = 0;
        if (result && result.length) {
          result.forEach(doc => {
            if (doc.book[0]) {
              const newDoc = {
                book: doc.book[0].title,
                lan: {from: doc.book[0].lanCode, to : doc._id.lan},
                points: doc.points
              };
              total += doc.points;
              scores.push(newDoc);
            }
          })
        }
        response.handleSuccess(res, {scores, total});
      });
    })
  }
}
