const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').book,
      Chapter = require('../models/book').chapter,
      Translation = require('../models/book').translation,
      Session = require('../models/book').session,
      UserBook = require('../models/userbook').userBook;

const setSessionDt = (startDate) => {
  return {
    start: startDate,
    end: Date.now(),
    diff: (new Date().getTime() - new Date(startDate).getTime()) / 1000
  };
}
module.exports = {
  getPublishedLanBooks: (req, res) => {
    const languageId = req.params.lan,
          sort = req.params.sort,
          query = {isPublished: true},
          projection = {};
    let options = {sort: {'difficulty.weight': 1}}
    if (languageId !== 'eu') {
      query['lanCode'] = languageId;
    }
    switch (sort) {
      case 'difficulty0':
        options['sort'] = {'difficulty.weight': -1};
        break;
      case 'sentences1':
        options['sort'] = {'difficulty.nrOfSentences': 1, 'difficulty.weight': 1};
        break;
      case 'sentences0':
        options['sort'] = {'difficulty.nrOfSentences': -1, 'difficulty.weight': -1};
        break;
    }
    Book.find(query, projection, options, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching books', () => {
        response.handleSuccess(res, books);
      });
    });
  },
  getBook: (req, res) => {
    const bookId = req.params.bookId,
          query = {_id: bookId, isPublished: true};
    Book.findOne(query, (err, book) => {
      response.handleError(err, res, 400, 'Error fetching book', () => {
        response.handleSuccess(res, book);
      });
    });
  },
  getUserLanBooks: (req, res) => {
    const lanCode = req.params.lan,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, lanCode};
    UserBook.find(query, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching user books', () => {
        response.handleSuccess(res, books);
      });
    });
  },
  getUserBook: (req, res) => {
    const bookId = req.params.bookId,
          lanCode = req.params.lan,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, bookId, lanCode};
    UserBook.findOne(query, (err, book) => {
      response.handleError(err, res, 400, 'Error fetching user book', () => {
        response.handleSuccess(res, book);
      });
    });
  },
  getChapter: (req, res) => {
    const bookId = req.params.bookId,
          chapterId = req.params.chapterId,
          sequence = req.params.sequence ? parseInt(req.params.sequence) : 1,
          query = chapterId === '0' ? {bookId, sequence} : {_id: chapterId},
          projection = {content: 0};
    Chapter.findOne(query, projection, (err, chapter) => {
      response.handleError(err, res, 400, 'Error fetching chapter', () => {
        response.handleSuccess(res, chapter);
      });
    });
  },
  getTranslations: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          lanCode = req.params.lan,
          sentence = req.params.sentence,
          query = {bookId, sentence, 'translations.lanCode': lanCode},
          projection = {
            _id:0,
            translation: "$translations.translation",
            note: "$translations.note",
            lanCode: "$translations.lanCode",
            score: "$translations.score"
          },
          pipeline = [
            {$match: query},
            {$unwind: "$translations"},
            {$match: {'translations.lanCode': lanCode}},
            {$project: projection}
          ];
    Translation.aggregate(pipeline, (err, translations) => {
      response.handleError(err, res, 400, 'Error fetching sentence translations', () => {
        response.handleSuccess(res, translations);
      });
    });
  },
  addTranslation: (req, res) => {
    const translation = req.body.translation,
          note = req.body.note,
          lanCode = req.body.userLanCode,
          bookLanCode = req.body.bookLanCode,
          sentence = req.body.sentence,
          bookId = req.body.bookId,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          newTranslation = {translation, note, lanCode, userId},
          query = {bookId, sentence},
          options = {upsert: true, new: false},
          update = {lanCode: bookLanCode, bookId, sentence, $push: {translations: {$each: [ newTranslation ], "$position": 0}}};
    Translation.findOneAndUpdate(query, update, options, (err, result) =>  {
      response.handleError(err, res, 400, 'Error adding translation', function() {
        response.handleSuccess(res, result);
      });
    });
  },
  getBookTranslations: (req, res) => {
    const userLan = req.params.lan,
          query = {'translations.lanCode': userLan},
          projection = {
            _id: 0,
            bookId: '$_id',
            count: 1
          },
          pipeline = [
            {$match: query},
            {$match: {'translations.lanCode': userLan}},
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
  updateBookmark: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = req.params.bookId,
          lanCode = req.params.lan,
          bookmark = req.body.bookmark,
          query = {bookId, userId, lanCode};
    bookmark.dt = Date.now()
    const update = {$set: {bookmark}};
    if (!bookmark.sentenceNrBook) {
      bookmark.sentenceNrBook = 0;
    }
    UserBook.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating bookmark', function() {
        response.handleSuccess(res, result);
      });
    });
  },
  addSession: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          sessionData = req.body.sessionData,
          startDate = req.body.startDate;
    sessionData.userId = userId;
    sessionData.dt = setSessionDt(startDate);
    session = new Session(sessionData);
    session.save(function(err, result) {
      response.handleError(err, res, 400, 'Error saving new session data', function(){
        response.handleSuccess(res, result._id);
      });
    });
  },
  updateSession: (req, res) => {
    const sessionData = req.body.sessionData,
          startDate = req.body.startDate;
    update = {$set: {
      answers: sessionData.answers,
      chapters: sessionData.chapters,
      nrYes: sessionData.nrYes,
      nrNo: sessionData.nrNo,
      nrMaybe: sessionData.nrMaybe,
      translations: sessionData.translations,
      dt: setSessionDt(startDate),
      points: sessionData.points
    }}
    Session.findByIdAndUpdate(sessionData._id, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating session', function() {
        response.handleSuccess(res, result);
      });
    });
  },
  getSessions: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lanCode = req.params.lan,
          query = {userId, lanCode},
          projection = {
            _id: 0,
            bookId: '$_id',
            nrSentencesDone: 1,
            nrYes: 1,
            nrMaybe: 1,
            nrNo: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: '$bookId',
              nrSentencesDone: {'$sum': { $strLenCP: "$answers" }},
              nrYes: {'$sum': "$nrYes" },
              nrMaybe: {'$sum': "$nrMaybe" },
              nrNo: {'$sum': "$nrNo" }
            }},
            {$project: projection}
          ];
    Session.aggregate(pipeline, (err, sessions) => {
      response.handleError(err, res, 400, 'Error fetching session data', function() {
        response.handleSuccess(res, sessions);
      });
    })
  },
  getBookSessions: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = req.params.bookId,
          userLanCode = req.params.lan,
          query = {userId, bookId, lanCode: userLanCode},
          projection = {answers: 1, _id: 0},
          options = {sort: {'dt.end': 1}};
    Session.find(query, projection, options, (err, sessions) => {
      response.handleError(err, res, 400, 'Error fetching book session data', function() {
        const answers = sessions.map(s => s.answers);
        response.handleSuccess(res, answers);
      });
    })

  }
}
