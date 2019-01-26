const response = require('../response'),
      mongoose = require('mongoose'),
      Session = require('../models/book').session,
      UserBook = require('../models/userbook').userBook;

const getCutOffDate = (period) => {
  let cutOff = null;
  // const date = new Date();
  if (period === 'month') {
    // cutOff = new Date(date.getFullYear(), date.getMonth(), 1);
    cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - 30);
  }
  if (period === 'week') {
    // const dayDate = date.getDate() - date.getDay() + 1;
    // cutOff = new Date(date.getFullYear(), date.getMonth(), dayDate);
    cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - 7);
  }
  return cutOff;
}

const getTotalPoints = (userId, cb) => {
  const scoreBooksPipeline = [
          {$match: {userId}},
          {$group: {
            _id: null,
            totalPointsWords: {'$sum': '$points.words'},
            totalPointsTranslations: {'$sum': '$points.translations'},
            totalPointsTest: {'$sum': '$points.test'},
            totalPointsFinished: {'$sum': '$points.finished'}
          }},
          {$project: {
            _id: 0,
            points: {'$add' : [ '$totalPointsWords', '$totalPointsTranslations', '$totalPointsFinished', '$totalPointsTest' ]}
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
    const userId =  new mongoose.Types.ObjectId(req.decoded.user._id);
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
                  '$points.test',
                  '$points.finished'
                ]
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
  },
  getLeaders: (req, res) => {
    const max = parseInt(req.params.max, 10) || 20,
          period = req.params.period,
          leadersPipeline = [
            {$group: {
              _id: '$userId',
              points: {'$sum': {$add : [ '$points.translations', '$points.finished', '$points.words', '$points.test' ]}}
            }},
            {$sort: {points: -1}},
            {$limit: max},
            {$project: {
              _id: 0,
              userId: '$_id',
              points: 1
            }}
          ],
          cutOff = getCutOffDate(period);
    if (cutOff) {
      const periodQuery = {$match: {'dt.end': {$gt: cutOff}}};
      leadersPipeline.unshift(periodQuery);
    }
    Session.aggregate(leadersPipeline, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching leaderboard', () => {
        response.handleSuccess(res, result);
      });
    })
  },
  getLeaderRank: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.params.userId),
          period = req.params.period,
          userPipeline = [
            {$match: {userId}},
            {$group: {
              _id: '$userId',
              points: {'$sum': {$add : [ '$points.translations', '$points.finished', '$points.words', '$points.test' ]}}
            }},
            {$project: {
              _id: 0,
              userId: '$_id',
              points: 1
            }}
          ],
          cutOff = getCutOffDate(period);
    if (cutOff) {
      const periodQuery = {$match: {'dt.end': {$gt: cutOff}}};
      userPipeline.unshift(periodQuery);
    }
    // Get points for user
    Session.aggregate(userPipeline, (err, results) => {
      let points = 0;
      response.handleError(err, res, 400, 'Error fetching user points', () => {
        if (results && results[0]) {
          points = results[0].points;
        }
        const rankPipeline = [
                {$group: {
                  _id: '$userId',
                  points: {'$sum': {$add : [ '$points.translations', '$points.finished', '$points.words', '$points.test' ]}}
                }},
                {$match: {points: {'$gt': points}}},
                {$count: 'rank'}
              ];
        if (cutOff) {
          const periodQuery = {$match: {'dt.end': {$gt: cutOff}}};
          rankPipeline.unshift(periodQuery);
        }
        Session.aggregate(rankPipeline, (err, results) => {
          response.handleError(err, res, 400, 'Error fetching user rank', () => {
            if (results[0]) {
              response.handleSuccess(res, {position: results[0].rank, points});
            } else {
              response.handleSuccess(res, {});
            }
          });
        });
      });
    });
  }
}
