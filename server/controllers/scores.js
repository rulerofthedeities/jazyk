const response = require('../response'),
      mongoose = require('mongoose'),
      Session = require('../models/book').session,
      UserBook = require('../models/userbook').userBook;

const getTotalPoints = (userId, cb) => {
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
    cb(err, null);
  });
}

module.exports = {
  getTotalScore: (req, res) => {
    const user = req.params.userId,
          userId = user ? new mongoose.Types.ObjectId(user) : new mongoose.Types.ObjectId(req.decoded.user._id);
    getTotalPoints(userId, (err, score) => {
      response.handleError(err, res, 400, 'Error fetching total score', () => {
        response.handleSuccess(res, score.toString());
      });
    });
  },
  getBookScores: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookType = req.params.bookType;
          pipeline = [
            {$match: {userId, bookType}},
            {$group: {
              _id: {
                bookId: '$bookId',
                lan: '$lanCode'
              },
              totalPoints: {'$sum': { $add : [
                '$points.words',
                '$points.translations',
                '$points.finished']
              }},
              repeats: {$max: '$repeatCount'}
            }},
            {$sort: {'totalPoints': -1}},
            {$lookup: {
              from: bookType === 'listen' ? 'audiobooks' : 'books',
              localField: '_id.bookId',
              foreignField: '_id',
              as: 'book'
            }},
            {$project: {
              _id: 1,
              book: 1,
              points: '$totalPoints',
              repeatCount: '$repeats'
            }}
          ];
    Session.aggregate(pipeline, function(err, result) {
      response.handleError(err, res, 400, 'Error fetching score per book', () => {
        let scores = [];
        let total = 0;
        if (result && result.length) {
          result.forEach(doc => {
            if (doc.book[0]) {
              const book = doc.book[0],
                    newDoc = {
                      bookTitle: book.title,
                      bookId: book._id,
                      lan: {from: book.lanCode, to : doc._id.lan},
                      points: doc.points,
                      repeatCount: doc.repeatCount
                    };
              total += doc.points;
              scores.push(newDoc);
            }
          })
        }
        response.handleSuccess(res, {scores, total});
      });
    });
  },
  getFinishedBooks: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, 'bookmark.isBookRead': true};
    UserBook.find(query, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching finished books', () => {
        response.handleSuccess(res, result);
      });
    })
  }
}
