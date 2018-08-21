const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').book,
      UserBook = require('../models/userbook').userBook,
      Translation = require('../models/book').translation,
      Session = require('../models/book').session,
      Result = require('../models/result'),
      Course = require('../models/course').model,
      UserCourse = require('../models/usercourse').model,
      Message = require('../models/message'),
      Notification = require('../models/notification');

module.exports = {
  getCount: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          scorePipeline = [
            {$match: {userId}},
            {$group: {
              _id: null,
              totalPoints: {'$sum': '$points'}
            }},
            {$project: {
              _id: 0,
              points: '$totalPoints'
            }}
          ],
          coursesLearningPipeline = [
            {$match: {userId}},
            {$group: {
              _id: null,
              countSubscribed: {'$sum': {$cond: ["$subscribed", 1, 0]}},
              countNotSubscribed: {'$sum': {$cond: ["$subscribed", 0, 1]}}
            }}
          ],
          booksReadingPipeline = [
            {$match: {userId}},
            {$group: {
              _id: null,
              countStarted: {'$sum': {$cond: ["$bookmark", 1, 0]}},
              countNotSubscribed: {'$sum': {$cond: ["$subscribed", 0, 1]}},
              read: {'$sum': {$cond: ["$bookmark.isBookRead", 1, 0]}}
            }}
          ];

    const getCount = async () => {
      const score = await Result.aggregate(scorePipeline),
            coursesLearning = await UserCourse.aggregate(coursesLearningPipeline),
            booksReading = await UserBook.aggregate(booksReadingPipeline),
            subscribedCourses = coursesLearning[0] ? coursesLearning[0].countSubscribed || 0 : 0,
            unsubscribedCourses = coursesLearning[0] ? coursesLearning[0].countNotSubscribed || 0 : 0,
            startedBooks = booksReading[0] ? booksReading[0].countStarted || 0 : 0,
            unsubscribedBooks = booksReading[0] ? booksReading[0].countNotSubscribed || 0 : 0,
            readBooks = booksReading[0] ? booksReading[0].read || 0 : 0,
            points = score[0] ? score[0].points || 0 : 0;
      return {
        score: points,
        coursesLearning: {
          subscribed: subscribedCourses,
          unsubscribed: unsubscribedCourses,
          total: subscribedCourses + unsubscribedCourses
        },
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
      console.log(err);
      response.handleError(err, res, 500, 'Error fetching dashboard count data');
    });
  },
  getCommunication: function(req, res) {
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
  },
  recentCourses: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          max = req.params.max || '3',
          resultsPipeline = [
            {$match: {userId}},
            {$sort: {dt: -1, sequence: -1}},
            {$group: {
              _id: '$courseId',
              firstDate: {'$first': '$dt'},
            }},
            {$sort: {firstDate: -1}},
            {$limit: parseInt(max, 10)},
            {$project: {
              _id: 0,
              courseId: '$_id',
              dt: '$firstDate'
            }}
          ];
    Result.aggregate(resultsPipeline, function(err, idResults) {
      response.handleError(err, res, 400, 'Error fetching recent courseIds from results', function() {
        if (idResults) {
          const courseIdArr = [];
          idResults.forEach(result => {
            courseIdArr.push(new mongoose.Types.ObjectId(result.courseId));
          });
          const query = {_id: {$in: courseIdArr}};
          Course.find(query, function(err, courseResults) {
            response.handleError(err, res, 400, 'Error fetching recent courses', function() {
              const recentCourses = [];
              // Add date last result for each course
              courseResults.forEach((course, i, courses) => {
                id = idResults.find(result => result.courseId.toString() === course._id.toString());
                if (id) {
                  recentCourses.push({dt: id.dt, course, tpe: 'course'})
                }
              });
              response.handleSuccess(res, recentCourses);
            });
          });
        } else {
          response.handleSuccess(res, []);
        }
      });
    });
  },
  recentBooks: function(req, res) {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          max = parseInt(req.params.max, 10) || 3,
          query = {userId},
          options = {sort: {'bookmark.dt': -1}, limit: max};
    UserBook.find(query, {}, options, (err, userBooks) => {
      response.handleError(err, res, 400, 'Error fetching recent user books', () => {
        if (userBooks) {
          // Find all data for each book id
          const getBookData = async () => {
            bookData = userBooks.map(async (uBook, i) => {
              // Get book & session data
              const userLan = uBook.lanCode,
                    book = await Book.findOne({_id: uBook.bookId});
              // Get session count

              const sesQuery = {userId, lanCode: userLan, bookId: uBook.bookId},
                    sesProjection = {
                      _id: 0,
                      bookId: '$_id',
                      nrSentencesDone: 1,
                      nrYes: 1,
                      nrMaybe: 1,
                      nrNo: 1
                    },
                    sesPipeline = [
                      {$match: sesQuery},
                      {$group: {
                        _id: '$bookId',
                        nrSentencesDone: {'$sum': { $strLenCP: "$answers" }},
                        nrYes: {'$sum': "$nrYes" },
                        nrMaybe: {'$sum': "$nrMaybe" },
                        nrNo: {'$sum': "$nrNo" }
                      }},
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
                translations: translations[0]});
            });
            return Promise.all(bookData);
          };

          getBookData().then((results) => {
            response.handleSuccess(res, results);
          }).catch((err) => {
            console.log(err);
            response.handleError(err, res, 400, 'Error fetching book data');
          });
        } else {
          response.handleSuccess(res, []);
        }
      });
    });
  }
}
