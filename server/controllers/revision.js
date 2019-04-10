'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      Session = require('../models/book').session,
      Chapter = require('../models/book').chapter,
      Translation = require('../models/book').translation;

module.exports = {
  getSessionData: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = req.params.bookId,
          lanCode = req.params.lan,
          bookType = req.params.bookType,
          query = {bookId, userId, lanCode, bookType},
          projection = {
            answers: 1,
            dt: 1,
            repeatCount: 1,
            chapterSequence: 1,
            sentenceNrChapter: 1,
            lastChapterSequence: 1,
            lastSentenceNrChapter: 1
          },
          options = {sort: {repeatCount: 1, 'dt.end': 1}};
    Session.find(query, projection, options, (err, sessions) => {
      response.handleError(err, res, 400, 'Error fetching session data', () => {
        response.handleSuccess(res, sessions);
      });
    });
  },
  getChapterData: (req, res) => {
    const chapterId = req.params.chapterId,
          projection = {sentences: 1};
    Chapter.findById(chapterId, projection, (err, chapter) => {
      response.handleError(err, res, 400, 'Error fetching chapter data', () => {
        response.handleSuccess(res, chapter);
      });
    });
  },
  getTranslationData: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          bookLan = req.params.bookLan,
          userLan = req.params.userLan,
          chapterSequence = parseInt(req.params.chapterSequence, 10) || 1,
          query = {
            bookId,
            chapterSequence,
            lanCode: bookLan,
            'translations.lanCode': userLan
          },
          projection = {
            _id: 0,
            sentence: 1,
            translations: {
              '$filter': {
                input: '$translations',
                as: 'translations',
                cond: {$eq: ['$$translations.lanCode', userLan]}
              }
            },
          },
          pipeline = [
            {$match: query},
            {$project: projection}
          ];
    Translation.aggregate(pipeline, (err, translations) => {
      response.handleError(err, res, 400, 'Error fetching translations', () => {
        response.handleSuccess(res, translations);
      });
    });
  }
}
