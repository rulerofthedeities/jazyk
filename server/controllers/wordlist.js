'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      WordList = require('../models/wordlist').word,
      UserWordList = require('../models/wordlist').userword;

module.exports = {
  getWordList: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          query = {bookId: bookId},
          projection = {},
          options = {sort: {sortWord: 1}};
    WordList.find(query, projection, options, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching word list', () => {
        response.handleSuccess(res, words);
      });
    });
  },
  getUserWordList: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          query = {bookId};
    UserWordList.find(query, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching user word list', () => {
        response.handleSuccess(res, words);
      });
    });
  },
  updateMyList: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          word = req.body.word,
          pin = req.body.pin,
          query = {
            wordId: word._id,
            bookId,
            userId,
            lanCode: word.lanCode
          },
          update = {pinned: pin};
    UserWordList.findOneAndUpdate(query, update, {upsert: true, isNew: true}, (err, result) => {
      response.handleError(err, res, 400, 'Error toggling word in user word list', () => {
        response.handleSuccess(res, result);
      });
    });
  }
}
