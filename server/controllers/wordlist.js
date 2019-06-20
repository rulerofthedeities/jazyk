'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').book,
      WordList = require('../models/wordlist').word,
      UserWordList = require('../models/wordlist').userword,
      WordTranslations = require('../models/wordlist').translations;

module.exports = {
  getBooksCount: (req, res) => {
    const query = {
            isPublished: true,
            wordListPublished: true
          },
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
      response.handleError(err, res, 400, 'Error fetching glossaries count', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getUserWordListCount: (req, res) => {
    // total + translated # of user words per book
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookLan = req.params.lan,
          targetLan = req.params.targetLan,
          query = {
            userId,
            bookLanCode: bookLan,
            targetLanCode: targetLan
          },
          projection = {
            _id: 0,
            bookId: '$_id',
            countTotal: 1,
            countTranslation: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: '$bookId',
              countTotal: {'$sum': 1},
              countTranslation: {'$sum': {'$cond': [{'$eq': ['$translations', '']}, 0, 1]}}
            }},
            {$project: projection}
          ];
    UserWordList.aggregate(pipeline, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching user word count', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getBookWordListCount: (req, res) => {
    // translated # of words in glossary per book
    const bookLan = req.params.lan,
          targetLan = req.params.targetLan,
          query = {
            lanCode: bookLan,
            'translations.lanCode': targetLan
          },
          projection = {
            _id: 0,
            bookId: '$_id',
            countTranslation: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: '$bookId',
              countTranslation: {'$sum': 1}
            }},
            {$project: projection}
          ];
    WordTranslations.aggregate(pipeline, (err, result) => {
      console.log('err', err);
      console.log('result', result);
      response.handleError(err, res, 400, 'Error fetching word translations count', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getPublishedLanGlossaries: (req, res) => {
    const languageId = req.params.lan,
          sort = req.params.sort,
          query = {
            isPublished: true,
            wordListPublished: true
          },
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
      response.handleError(err, res, 400, 'Error fetching glossaries', () => {
        response.handleSuccess(res, books);
      });
    });
  },
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
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          userLanCode = req.params.lan,
          query = {
            userId,
            bookId,
            targetLanCode: userLanCode
          };
    UserWordList.find(query, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching user word list', () => {
        response.handleSuccess(res, words);
      });
    });
  },
  getFlashcardWords: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          userLanCode = req.params.lan,
          maxWords = req.params.max || 10,
          query = {
            userId,
            bookId,
            targetLanCode: userLanCode
          },
          userWordPipeline = [
            {$match: query},
            {$sample: {size: parseInt(maxWords, 10)}}
          ];
    UserWordList.aggregate(userWordPipeline, (err, userWords) => {
      response.handleError(err, res, 400, 'Error fetching user word list for flashcards', () => {
        console.log('user words', userWords);
        // For each user word, find matching word
        const wordIds = userWords.map(uWord => uWord.wordId),
              query = {_id: {$in: wordIds}};
        WordList.find(query, (err, words) => {
          response.handleError(err, res, 400, 'Error fetching word list for flashcards', () => {
            response.handleSuccess(res, {userWords, words});
          });
        });
      });
    });
  },
  updateMyList: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          word = req.body.word,
          wordId = new mongoose.Types.ObjectId(word._id),
          pin = req.body.pin,
          summary = req.body.summary,
          query = {
            wordId,
            bookId,
            userId,
            targetLanCode: word.targetLanCode
          },
          update = {
            $set: {
              pinned: pin,
              translations: summary
            },
            $setOnInsert: {
              bookLanCode: word.lanCode
            }
          },
          options = {
            upsert: true,
            isNew: true
          };
    UserWordList.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error toggling word in user word list', () => {
        response.handleSuccess(res, pin);
      });
    });
  },
  removeFromMyList: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          word = req.body.word,
          userLanCode = req.body.userLanCode,
          wordId = new mongoose.Types.ObjectId(word._id),
          query = {
            wordId,
            bookId,
            userId,
            targetLanCode: userLanCode
          },
          update = {
            $set: {
              pinned: false
            }
          };
    UserWordList.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error removing word from list', () => {
        response.handleSuccess(res, false);
      });
    });
  },
  addAllToMyList: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          words = req.body.words;
    if (words.length > 0) {
      let docs = words.map(word => {
        const wordId = new mongoose.Types.ObjectId(word._id),
              query = {
                wordId,
                bookId,
                userId,
                targetLanCode: word.targetLanCode
              };
        return {
          updateOne: {
            filter: query,
            update: {
              $set: {
                pinned: true
              },
              $setOnInsert: {
                bookLanCode: word.lanCode,
                translations: word.translationSummary
              }
            },
            upsert: true
          }
        }
      });
      UserWordList.collection.bulkWrite(docs, (err, bulkResult) => {
        response.handleError(err, res, 400, 'Error pinning all words', () => {
          response.handleSuccess(res, true);
        });
      })
    } else {
      response.handleSuccess(res, true);
    }
  },
  updateUserWordTranslation: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          wordId = new mongoose.Types.ObjectId(req.body.wordId),
          newTranslations = req.body.newTranslation,
          targetLanCode = req.body.userLanCode,
          query = {
            userId,
            bookId,
            wordId,
            targetLanCode: targetLanCode
          },
          update = {
            $set: {
              translations: newTranslations
            }
          };
    UserWordList.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating user word translation', () => {
        response.handleSuccess(res, false);
      });
    });
  }
}
