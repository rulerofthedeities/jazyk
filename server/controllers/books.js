const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').book,
      Chapter = require('../models/book').chapter,
      Translation = require('../models/book').translation,
      UserBook = require('../models/userbook').userBook;

module.exports = {
  getPublishedLanBooks: (req, res) => {
    const languageId = req.params.lan,
          query = {isPublished: true},
          projection = {},
          options = {sort: {'difficulty.weight': 1}};
    if (languageId !== 'eu') {
      query['lanCode'] = languageId;
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
          sequence = req.params.sequence ? parseInt(req.params.sequence) : 1,
          query = {bookId, sequence};
    Chapter.findOne(query, (err, chapter) => {
      response.handleError(err, res, 400, 'Error fetching chapter', () => {
        response.handleSuccess(res, chapter);
      });
    });
  },
  getTranslations: (req, res) => {
    const bookId = req.params.bookId,
          lanCode = req.params.lan,
          sentence = req.params.sentence,
          query = {bookId, sentence, 'translations.lanCode': lanCode},
          projections = {_id: 0, translations: 1};
    Translation.findOne(query, projections, (err, translations) => {
      translationsArr = translations ? translations.translations : [];
      response.handleError(err, res, 400, 'Error fetching sentence translations', () => {
        response.handleSuccess(res, translationsArr);
      });
    });
  },
  addTranslation: (req, res) => {
    const translation = req.body.translation,
          note = req.body.note,
          lanCode = req.body.lanCode,
          sentence = req.body.sentence,
          bookId = req.body.bookId,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          newTranslation = {translation, note, lanCode, userId},
          query = {bookId, sentence},
          options = {upsert: true, new: false},
          update = {bookId, sentence, $push: {translations: {$each: [ newTranslation ], "$position": 0}}};
    Translation.findOneAndUpdate(query, update, options, (err, result) =>  {
      response.handleError(err, res, 400, 'Error adding translation', function() {
        response.handleSuccess(res, result);
      });
    });
  },
  updateBookmark: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = req.params.bookId,
          bookmark = req.body.bookmark,
          query = {bookId, userId},
          update = {$set: {bookmark}};
        console.log(bookmark);
    UserBook.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating bookmark', function() {
        response.handleSuccess(res, result);
      });
    })
  }
}
