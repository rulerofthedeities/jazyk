'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').book,
      UserBook = require('../models/userbook').userBook,
      Translation = require('../models/book').translation,
      Session = require('../models/book').session,
      Message = require('../models/message'),
      Notification = require('../models/notification');

module.exports = {
  getCount: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          scoreBooksPipeline = [
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
          ],
          booksReadingPipeline = [
            {$match: {userId, bookType: 'read'}},
            {$group: {
              _id: null,
              countStarted: {'$sum': {$cond: ["$bookmark", 1, 0]}},
              countNotSubscribed: {'$sum': {$cond: ["$subscribed", 0, 1]}},
              read: {'$sum': {$cond: ["$bookmark.isBookRead", 1, 0]}}
            }}
          ];

    const getCount = async () => {
      const scoreBooks = await Session.aggregate(scoreBooksPipeline),
            booksReading = await UserBook.aggregate(booksReadingPipeline),
            startedBooks = booksReading[0] ? booksReading[0].countStarted || 0 : 0,
            unsubscribedBooks = booksReading[0] ? booksReading[0].countNotSubscribed || 0 : 0,
            readBooks = booksReading[0] ? booksReading[0].read || 0 : 0,
            pointsBooks = scoreBooks[0] ? scoreBooks[0].points || 0 : 0;
      return {
        score: pointsBooks,
        booksReading: {
          subscribed: startedBooks,
          unsubscribed: unsubscribedBooks,
          total: startedBooks + unsubscribedBooks,
          completed: readBooks
        }
      };
    };

    getCount().then((results) => {
      response.handleSuccess(res, results);
    }).catch((err) => {
      response.handleError(err, res, 500, 'Error fetching dashboard count data');
    });
  },
  /*
  getCommunication: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          max = req.params.max || '5',
          options = {limit: parseInt(max, 10), sort: {dt: -1}},
          messageQuery = {
            'recipient.id': userId,
            'recipient.trash': false,
            'recipient.deleted': false
          },
          notificationQuery = {userId},
          notificationProjection = {title: 1, read: 1, dt: 1};
    const getCommunication = async () => {
      const messages = await Message.find(messageQuery, {}, options),
            notifications = await Notification.find(notificationQuery, notificationProjection, options);
      return {messages, notifications};
    };

    getCommunication().then((results) => {
      response.handleSuccess(res, results);
    }).catch((err) => {
      response.handleError(err, res, 500, 'Error fetching dashboard communications data');
    });
  },*/
  getRecentMail: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          max = req.params.max || '5',
          options = {
            limit: parseInt(max, 10),
            sort: {dt: -1}
          },
          query = {
            'recipient.id': userId,
            'recipient.trash': false,
            'recipient.deleted': false
          };
    Message.find(query, {}, options, (err, mails) => {
      response.handleError(err, res, 400, 'Error fetching recent mails', () => {
        response.handleSuccess(res, mails);
      });
    });
  },
  recentBooks: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          max = parseInt(req.params.max, 10) || 3,
          query = {userId},
          options = {
            sort: {'bookmark.dt': -1},
            limit: max
          };
    UserBook.find(query, {}, options, (err, userBooks) => {
      response.handleError(err, res, 400, 'Error fetching recent user books', () => {
        if (userBooks) {
          // Find all data for each book id
          const getBookData = async () => {
            const bookData = userBooks.map(async (uBook, i) => {
              // Get book & session data
              const userLan = uBook.lanCode;
              let book = null;
              if (uBook.bookType === 'listen') {
                book = await Book.findOne({_id: uBook.bookId, audioPublished: true});
              } else {
                book = await Book.findOne({_id: uBook.bookId, isPublished: true});
              }
              // Get session count
              const sesQuery = {
                      userId,
                      lanCode: userLan,
                      bookId: uBook.bookId,
                      bookType: uBook.bookType,
                      isTest: uBook.isTest
                    },
                    sesProjection = {
                      _id: 0,
                      bookId: '$_id.bookId',
                      nrSentencesDone: 1,
                      nrYes: 1,
                      nrMaybe: 1,
                      nrNo: 1
                    },
                    sesPipeline = [
                      {$match: sesQuery},
                      {$group: {
                        _id: {
                          bookId: '$bookId',
                          isTest: '$isTest',
                          repeat: '$repeatCount'
                        },
                        nrSentencesDone: {'$sum': { $strLenCP: "$answers" }},
                        nrYes: {'$sum': "$nrYes" },
                        nrMaybe: {'$sum': "$nrMaybe" },
                        nrNo: {'$sum': "$nrNo" }
                      }},
                      {$sort: {'_id.repeat': -1}},
                      {$project: sesProjection}
                    ];
              const sessions = await Session.aggregate(sesPipeline);
              // Get translations count
              const tlQuery = {bookId: uBook.bookId, 'translations.lanCode': userLan},
                    tlProjection = {
                      _id: 0,
                      bookId: '$_id',
                      count: 1
                    },
                    tlPipeline = [
                      {$match: tlQuery},
                      {$unwind: "$translations"},
                      {$match: {'translations.lanCode': userLan}},
                      {$group: {
                        _id: '$bookId',
                        count: {'$sum': 1}
                      }},
                      {$project: tlProjection}
                    ];
              const translations = await Translation.aggregate(tlPipeline);
              return ({
                dt: uBook.bookmark ? uBook.bookmark.dt : null,
                tpe: 'book',
                userLanCode: userLan,
                uBook,
                book,
                sessions: sessions[0],
                translations: translations[0]
              });
            });
            return Promise.all(bookData);
          };

          getBookData().then((results) => {
            response.handleSuccess(res, results);
          }).catch((err) => {
            response.handleError(err, res, 400, 'Error fetching book data');
          });
        } else {
          response.handleSuccess(res, []);
        }
      });
    });
  },
  getHomeStats: (req, res) => {
    const sentencePipeline = [
            {$match: {
              isPublished: true
            }},
            {$group: {
                _id: null,
                sentencesCount: { $sum: "$difficulty.nrOfSentences" }
            }},
            {$project: {
              _id: 0,
              sentencesCount: '$sentencesCount'
            }}
          ],
          translationPipeline2 = [
            {$unwind: "$translations"},
            {$count: "translationCount"},
          ],
          glossaryPipeline = [
            {$match: {
              isPublished: true,
              wordListPublished: true
            }},
            {$group: {
                _id: null,
                glossaryCount: { $sum: 1 },
                wordCount: { $sum: "$nrOfWordsInList" }
            }},
            {$project: {
              _id: 0,
              wordCount: '$wordCount',
              glossaryCount: '$glossaryCount'
            }}
          ];

    const getStats = async () => {
      const audioBooksCount = await Book.countDocuments({isPublished: true, audioPublished: true}),
            booksCount = await Book.countDocuments({isPublished: true}),
            sentencesCount = await Book.aggregate(sentencePipeline),
            translationsCount = await Translation.aggregate(translationPipeline2),
            glossariesCount = await Book.aggregate(glossaryPipeline);
      return {
        audioBooksCount,
        booksCount,
        sentencesCount,
        translationsCount,
        glossariesCount
      };
    };

    getStats().then((results) => {
      const audioBooksCount = results.audioBooksCount,
            booksCount = results.booksCount,
            sentencesCount = results.sentencesCount,
            translationsCount = results.translationsCount,
            glossariesCount = results.glossariesCount;
      const stats = {
        nrOfAudioBooks: audioBooksCount,
        nrOfBooks: booksCount,
        nrOfSentences: sentencesCount[0].sentencesCount,
        nrOfTranslations: translationsCount[0].translationCount,
        nrOfGlossaries: glossariesCount[0].glossaryCount,
        nrOfWords: glossariesCount[0].wordCount
      }
      response.handleSuccess(res, stats);
    }).catch((err) => {
      response.handleError(err, res, 500, 'Error fetching home stats');
    });
  }
}
