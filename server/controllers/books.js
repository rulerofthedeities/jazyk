const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').book;
      UserBook = require('../models/userbook').userBook;

module.exports = {
  getPublishedLanBooks: function(req, res) {
    const languageId = req.params.lan,
          query = {
            isPublished: true
          },
          projection = {},
          options = {sort: {'difficulty.weight': 1}};
    if (languageId !== 'eu') {
      query['lanCode'] = languageId;
    }
    Book.find(query, projection, options, function(err, books) {
      console.log(books);
      response.handleError(err, res, 400, 'Error fetching books', function(){
        response.handleSuccess(res, books);
      });
    });
  },
  getUserLanBooks: function(req, res) {
    const languageId = req.params.lan,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, lanCode: languageId};
    UserBook.find(query)
  }
}
