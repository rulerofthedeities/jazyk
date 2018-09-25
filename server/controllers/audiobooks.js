const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').audiobook;

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
      case 'newest0':
        options['sort'] = {'dt.published': -1};
        break;
    }
    Book.find(query, projection, options, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching audio books', () => {
        response.handleSuccess(res, books);
      });
    });
  }
}
