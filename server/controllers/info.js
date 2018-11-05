const response = require('../response'),
      Page = require('../models/page'),
      Book = require('../models/book').book,
      Audiobook = require('../models/book').audiobook;

module.exports = {
  getPage: (req, res) => {
    const page = req.params.page,
          lan = req.params.lan,
          loggedIn = req.params.loggedIn,
          query = {
            tpe:'info',
            name: page,
            lan: lan
          };
    if (loggedIn === 'true') {
      query.loggedIn = true;
    } else {
      query.loggedOut = true;
    }
    Page.findOne(query, (err, result) => {
      response.handleError(err, res, 400, `Error getting info page "${page}"`, () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getBooklist: (req, res) => {
    const tpe = req.params.tpe,
          Model = tpe === 'listen' ? Audiobook : Book,
          query = {isPublished: true},
          options = {sort: {lanCode: 1, title: 1}},
          pipeline = [
            {$match: query},
            {$sort: {title: 1}},
            {$group: {
              "_id": "$lanCode",
              "docs": {"$push": "$$ROOT"}}
            },
            {$project: {
              _id: 0,
              lanCode: "$_id",
              books: "$docs"
            }}
          ];
    Model.aggregate(pipeline, (err, books) => {
      response.handleError(err, res, 400, `Error getting book list for type "${tpe}"`, () => {
        response.handleSuccess(res, books);
      });
    })
  }
}
