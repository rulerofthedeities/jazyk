'use strict';

const response = require('../response'),
      Page = require('../models/page'),
      Book = require('../models/book').book;

module.exports = {
  getInfoPage: (req, res) => {
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
          query = tpe === 'listen' ? {audioPublished: true} : {isPublished: true},
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
    Book.aggregate(pipeline, (err, books) => {
      response.handleError(err, res, 400, `Error getting book list for type "${tpe}"`, () => {
        response.handleSuccess(res, books);
      });
    })
  },
  getManualIndex: (req, res) => {
    const query = {tpe: 'manual'},
          projection = {
            _id: 0,
            name: 1,
            title: 1,
            sort: 1,
            isHeader: 1
          },
          options = {sort: {sort: 1}};
    Page.find(query, projection, options, (err, result) => {
      response.handleError(err, res, 400, `Error getting manual index`, () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getManualPage: (req, res) => {
    const pageName = decodeURIComponent(req.params.page),
          query = {tpe: 'manual', name: pageName};
    Page.findOne(query, (err, result) => {
      response.handleError(err, res, 400, `Error getting manual page "${pageName}"`, () => {
        response.handleSuccess(res, result);
      });
    });
  }
}
