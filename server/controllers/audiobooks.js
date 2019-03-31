'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').audiobook,
      Chapter = require('../models/audio').audiochapter;

module.exports = {
  getPublishedLanBooks: (req, res) => {
    const languageId = req.params.lan,
          sort = req.params.sort,
          query = {isPublished: true},
          projection = {};
    let options = {sort: {'difficulty.weight': 1}};
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
  },
  getBook: (req, res) => {
    const bookId = req.params.bookId,
          query = {_id: bookId, isPublished: true};
    Book.findOne(query, (err, book) => {
      response.handleError(err, res, 400, 'Error fetching audio book', () => {
        response.handleSuccess(res, book);
      });
    });
  },
  getBooksCount: (req, res) => {
    const query = {isPublished: true},
          projection = {
            _id: 0,
            lanCode: '$_id',
            count: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: '$lanCode',
              count: {'$sum': 1}
            }},
            {$project: projection}
          ];
    Book.aggregate(pipeline, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching audio books count', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getChapter: (req, res) => {
    const audioBookId = req.params.bookId,
          sequence = parseInt(req.params.sequence, 10) || 1,
          query = {audioBookId, sequence},
          projection = {content: 0};
    Chapter.findOne(query, projection, (err, chapter) => {
      response.handleError(err, res, 400, 'Error fetching audio chapter', () => {
        response.handleSuccess(res, chapter);
      });
    });
  },
  getAudioChapter: (req, res) => {
    // Audio for read book
    const audioBookId = req.params.bookId,
          sequence = req.params.sequence ? parseInt(req.params.sequence) : 1,
          query = {audioBookId, sequence},
          projection = {
            title: 1,
            directory: 1,
            'sentences.sequence': 1,
            'sentences.s3': 1,
            'sentences.text': 1,
            'sentences.isDisabled': 1
          };
    Chapter.findOne(query, projection, (err, chapter) => {
      response.handleError(err, res, 400, 'Error fetching audio chapter for read', () => {
        response.handleSuccess(res, chapter);
      });
    });

  },
  getChapterHeaders: (req, res) => {
    const audioBookId = new mongoose.Types.ObjectId(req.params.bookId),
          query = {audioBookId},
          projection = {content: 0, sentences: 0},
          chapterPipeline = [
            {$match: query},
            {$sort: {'sequence': 1}},
            {$project: projection}
          ];
    Chapter.aggregate(chapterPipeline, (err, chapters) => {
      response.handleError(err, res, 400, 'Error fetching chapter headers', () => {
        response.handleSuccess(res, chapters);
      });
    });
  }
}
