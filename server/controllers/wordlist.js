'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      WordList = require('../models/wordlist').word;

module.exports = {
  getWordList: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          query = {bookId},
          projection = {},
          options = {sequence: 1};
    WordList.find(query, projection, options, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching word list', () => {
        response.handleSuccess(res, words);
      });
    });
  }
}
