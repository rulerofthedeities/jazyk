'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      Session = require('../models/book').session,
      Translation = require('../models/book').translation,
      UserBook = require('../models/userbook').userBook,
      UserWordList = require('../models/wordlist').userword,
      WordTranslations = require('../models/wordlist').translations;

module.exports = {
  getActivity: (req, res) => {
    const query = {
            bookType: {$ne: 'glossary'}
          },
          projection = {
            _id: 0,
            bookId: '$_id.bookId',
            recommended: 1,
            started: 1,
            finished: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: {
                bookId: '$bookId',
                userId: '$userId'
              },
              recommended: {
                $sum: { $cond: ["$recommended", 1, 0] }
              },
              started: {
                $sum: { $cond: [{'$ifNull': ['$bookmark', false]}, 1, 0] }
              },
              finished: {
                $sum: {
                  $cond: [
                    {$or: [{'$gt': ['$repeatCount', 0]}, {'$eq': ['$bookmark.isBookRead', true]}]}, 1, 0
                  ]
                }
              }
            }},
            {$group: {
              _id: {
                bookId: '$_id.bookId'
              },
              recommended: {
                $sum: '$recommended'
              },
              started: {
                $sum: '$started'
              },
              finished: {
                $sum: '$finished'
              }
            }},
            {$project: projection}
          ];
      UserBook.aggregate(pipeline, (err, activity) => {
      response.handleError(err, res, 400, 'Error fetching user books activity', () => {
        response.handleSuccess(res, activity);
      });
    });
  },
  getUserLanBooks: (req, res) => {
    const lanCode = req.params.lan,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            userId,
            lanCode
          },
          projection = {
            bookId: 1,
            isTest: 1,
            subscribed: 1,
            recommended: 1,
            repeatCount: 1,
            bookmark: 1,
            bookType: 1
          };

    UserBook.find(query, projection, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching user books', () => {
        response.handleSuccess(res, books);
      });
    });
  },
  getStoryUserLanBooks: (req, res) => {
    // Data for just one book
    const lanCode = req.params.lan,
          bookType = req.params.bookType,
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            userId,
            bookId,
            lanCode,
            bookType
          },
          projection = {
            bookId: 1,
            isTest: 1,
            subscribed: 1,
            recommended: 1,
            repeatCount: 1,
            bookmark: 1
          };

    UserBook.find(query, projection, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching user books', () => {
        response.handleSuccess(res, books);
      });
    });
  },
  getSessions: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          targetLanCode = req.params.lan,
          bookType = req.params.bookType,
          query = {
            userId,
            lanCode: targetLanCode,
            bookType
          },
          projection = {
            _id: 0,
            bookId: '$_id.bookId',
            isTest: '$_id.isTest',
            repeatCount: '$_id.repeat',
            nrSentencesDone: 1,
            nrYes: 1,
            nrMaybe: 1,
            nrNo: 1,
            start: 1,
            end: 1
          },
          pipeline = [
            {$match: query},
            {$sort: {'dt.start': 1}},
            {$group: {
              _id: {
                bookId: '$bookId',
                isTest: '$isTest',
                repeat: '$repeatCount'
              },
              nrSentencesDone: {'$sum': { $strLenCP: "$answers" }},
              nrYes: {'$sum': "$nrYes" },
              nrMaybe: {'$sum': "$nrMaybe" },
              nrNo: {'$sum': "$nrNo" },
              start: {$first: '$dt.start'},
              end: {$last: '$dt.end'}
            }},
            {$project: projection}
          ];
    Session.aggregate(pipeline, (err, sessions) => {
      response.handleError(err, res, 400, 'Error fetching session data', () => {
        response.handleSuccess(res, sessions);
      });
    });
  },
  getStorySessions: (req, res) => {
    // Data for just one book
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          targetLanCode = req.params.lan,
          bookType = req.params.bookType,
          query = {
            userId,
            bookId,
            lanCode: targetLanCode,
            bookType
          },
          projection = {
            _id: 0,
            bookId: '$_id.bookId',
            isTest: '$_id.isTest',
            repeatCount: '$_id.repeat',
            nrSentencesDone: 1,
            nrYes: 1,
            nrMaybe: 1,
            nrNo: 1,
            start: 1,
            end: 1
          },
          pipeline = [
            {$match: query},
            {$sort: {'dt.start': 1}},
            {$group: {
              _id: {
                bookId: '$bookId',
                isTest: '$isTest',
                repeat: '$repeatCount'
              },
              nrSentencesDone: {'$sum': { $strLenCP: "$answers" }},
              nrYes: {'$sum': "$nrYes" },
              nrMaybe: {'$sum': "$nrMaybe" },
              nrNo: {'$sum': "$nrNo" },
              start: {$first: '$dt.start'},
              end: {$last: '$dt.end'}
            }},
            {$project: projection}
          ];
    Session.aggregate(pipeline, (err, sessions) => {
      response.handleError(err, res, 400, 'Error fetching session data', () => {
        response.handleSuccess(res, sessions);
      });
    });
  },
  getUserLanWords: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          targetLanCode = req.params.lan,
          query = {
            userId,
            targetLanCode
          },
          projection = {
            _id: 0,
            bookId: '$_id.bookId',
            lastAnswerAllYes: 1,
            lastAnswerMyYes: 1,
            lastAnswerAllNo: 1,
            lastAnswerMyNo: 1,
            pinned: 1,
            translated: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: {
                bookId: '$bookId'
              },
              lastAnswerAllYes: {'$sum': { $cond: [{'$eq': ['$lastAnswerAll', 'y']}, 1, 0] }},
              lastAnswerAllNo: {'$sum': { $cond: [{'$eq': ['$lastAnswerAll', 'n']}, 1, 0] }},
              lastAnswerMyYes: {'$sum': { $cond: [{'$eq': ['$lastAnswerMy', 'y']}, 1, 0] }},
              lastAnswerMyNo: {'$sum': { $cond: [{'$eq': ['$lastAnswerMy', 'n']}, 1, 0] }},
              pinned: {'$sum': { $cond: [{'$eq': ['$pinned', true]}, 1, 0] }},
              translated: {'$sum': { $cond: [
                {$and: [
                  {'$eq': ['$pinned', true]},
                  {'$ne': ['$translations', '']}
                ]}, 1, 0]}
              }
            }},
            {$project: projection}
          ];
    UserWordList.aggregate(pipeline, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching user words', () => {
        response.handleSuccess(res, words);
      });
    });
  },
  getStoryUserWords: (req, res) => {
    // Data for just one book
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          targetLanCode = req.params.lan,
          query = {
            userId,
            bookId,
            targetLanCode
          },
          projection = {
            _id: 0,
            bookId: '$_id.bookId',
            lastAnswerAllYes: 1,
            lastAnswerMyYes: 1,
            lastAnswerAllNo: 1,
            lastAnswerMyNo: 1,
            pinned: 1,
            translated: 1,
            total: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: {
                bookId: '$bookId'
              },
              lastAnswerAllYes: {'$sum': { $cond: [{'$eq': ['$lastAnswerAll', 'y']}, 1, 0] }},
              lastAnswerAllNo: {'$sum': { $cond: [{'$eq': ['$lastAnswerAll', 'n']}, 1, 0] }},
              lastAnswerMyYes: {'$sum': { $cond: [{'$eq': ['$lastAnswerMy', 'y']}, 1, 0] }},
              lastAnswerMyNo: {'$sum': { $cond: [{'$eq': ['$lastAnswerMy', 'n']}, 1, 0] }},
              pinned: {'$sum': { $cond: [{'$eq': ['$pinned', true]}, 1, 0] }},
              total: {'$sum': 1},
              translated: {'$sum': { $cond: [
                {'$and': [
                  {'$eq': ['$pinned', true]},
                  {'$ne': ['$translations', '']}
                ]}, 1, 0
              ] }}
            }},
            {$project: projection}
          ];
    UserWordList.aggregate(pipeline, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching user words', () => {
        response.handleSuccess(res, words[0]);
      });
    });
  },
  getStoryBookWordCount: (req, res) => {
    // Data for just one book
    const targetLan = req.params.lan,
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          query = {
            bookId,
            'translations.lanCode': targetLan
          },
          projection = {
            _id: 0,
            bookId: '$_id',
            countTranslation: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: '$bookId',
              countTranslation: {'$sum': 1}
            }},
            {$project: projection}
          ];
    WordTranslations.aggregate(pipeline, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching story word translations count', () => {
        response.handleSuccess(res, result[0]);
      });
    });
  },
  getTranslationsCount: (req, res) => {
    const targetLan = req.params.lan,
          query = {'translations.lanCode': targetLan},
          projection = {
            _id: 0,
            bookId: '$_id',
            count: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: '$bookId',
              count: {'$sum': 1}
            }},
            {$project: projection}
          ];
    Translation.aggregate(pipeline, (err, translations) => {
      response.handleError(err, res, 400, 'Error fetching translations count', () => {
        response.handleSuccess(res, translations);
      });
    });
  },
  getStoryTranslationsCount: (req, res) => {
    const targetLan = req.params.lan,
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          query = {
            bookId,
            'translations.lanCode': targetLan
          };
    Translation.countDocuments(query, (err, translations) => {
      response.handleError(err, res, 400, 'Error fetching story translations count', () => {
        response.handleSuccess(res, {count: translations});
      });
    });
  },
  getFinishedStatus: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          targetLan = req.params.lan,
          query = {
            userId,
            lanCode: targetLan
          },
          projection = {
            bookId: '$_id.bookId',
            isTest: '$_id.isTest',
            bookType: '$_id.tpe',
            isFinished: {$cond: [{'$gte': ['$repeatCount', 1]}, 1, '$isRead']}
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: {
                bookId: '$bookId',
                isTest: '$isTest',
                tpe: '$bookType'
              },
              isRead: {
                $sum: { $cond: [{'$eq': ['$bookmark.isBookRead', true]}, 1, 0]}
              },
              repeatCount: {$sum: '$repeatCount'}
            }},
            {$project: projection}
          ];
    UserBook.aggregate(pipeline, (err, userBooks) => {
      response.handleError(err, res, 400, 'Error fetching finished data', () => {
        response.handleSuccess(res, userBooks);
      });
    });
  }
}
