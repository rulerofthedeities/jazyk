'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      log = require('./log'),
      Book = require('../models/book').book,
      UserBook = require('../models/userbook').userBook,
      WordList = require('../models/wordlist').word,
      Session = require('../models/book').session,
      UserWordList = require('../models/wordlist').userword,
      SentenceWords = require('../models/wordlist').sentenceword,
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
            targetLanCode: targetLan,
            pinned: true
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
            'translations.lanCode': targetLan,
            exclude: {$ne: true}
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
        options['sort'] = {'dt.publishedGlossary': -1};
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
    // Also show excluded word if admin
    if (!req.decoded.user.isAdmin) {
      query.exclude = {$ne: true};
    }
    WordList.find(query, projection, options, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching word list', () => {
        response.handleSuccess(res, words);
      });
    });
  },
  getChapterWordList: (req, res) => {
    // words for sentences -> excluded words must be included!
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          chapterSequence = req.params.sequence ? parseInt(req.params.sequence) : 1,
          targetLanCode = req.params.lan,
          key = 'translationSummary.' + targetLanCode,
          query = {
            bookId,
            chapterSequences: chapterSequence
          },
          pipeline = [
            {$match: query},
            {$project: {
              audio: 1,
              word: 1,
              aspect: 1,
              transitivity: 1,
              genus: 1,
              wordType: 1,
              translationSummary: 1,
              chapterSequences: 1
            }}
          ];
    WordList.aggregate(pipeline, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching chapter word list', () => {
        response.handleSuccess(res, words);
      });
    });
  },
  getChapterUserWordList: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          chapterSequence = req.params.sequence ? parseInt(req.params.sequence) : 1,
          targetLanCode = req.params.lan,
          query = {
            bookId,
            userId,
            chapterSequences: chapterSequence,
            targetLanCode,
            pinned: true
          };
    UserWordList.find(query, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching chapter user word list', () => {
        response.handleSuccess(res, words);
      });
    });
  },
  getSentenceWordsBySequence: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          chapterSequence = req.params.sequence ? parseInt(req.params.sequence) : 1,
          query = {
            bookId,
            chapterSequence
          };
    SentenceWords.find(query, (err, docs) => {
      response.handleError(err, res, 400, 'Error fetching sentence words by sequence', () => {
        response.handleSuccess(res, docs);
      });
    });
  },
  getSentenceWordsByWord: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          wordId = new mongoose.Types.ObjectId(req.params.wordId),
          query = {
            bookId,
            'words.wordId': wordId
          };
    SentenceWords.find(query, (err, docs) => {
      response.handleError(err, res, 400, 'Error fetching sentence words by wordId', () => {
        response.handleSuccess(res, docs);
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
  getMyFlashcardWords: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          targetLanCode = req.params.lan,
          maxWords = req.params.max || 10,
          query = {
            userId,
            bookId,
            targetLanCode,
            pinned: true,
            translations: {$nin: [ null, "" ]}
          },
          userWordPipeline = [
            {$match: query},
            {$sort: {lastAnswerMy: 1, dtFlashcard: 1}},
            {$limit: parseInt(maxWords, 10)}
          ];
    // Get user words first, then get corresponding words
    UserWordList.aggregate(userWordPipeline, (err, userWords) => {
      response.handleError(err, res, 400, 'Error fetching user word list for my flashcards', () => {
        // For each user word, find matching word
        const wordIds = userWords.map(uWord => uWord.wordId),
              query = {_id: {$in: wordIds}};
        WordList.find(query, (err, words) => {
          response.handleError(err, res, 400, 'Error fetching word list for my flashcards', () => {
            response.handleSuccess(res, {userWords, words});
          });
        });
      });
    });
  },
  getAllFlashcardWords: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          targetLanCode = req.params.lan,
          maxWords = req.params.max || 10,
          key = 'translationSummary.' + targetLanCode,
          query = {
            bookId,
            exclude: {$ne: true},
            [key]: {$exists: true, $nin: [ null, "" ]}
          },
          wordsPipeline = [
            {$match: query},
            {$sample: {size: parseInt(maxWords, 10)}}
          ];
    // Get translations first (to ensure there are translations for a word), then get corresponding words
    WordList.aggregate(wordsPipeline, (err, words) => {
      response.handleError(err, res, 400, 'Error fetching word translations for all flashcards', () => {
        // Translation summary should be string io object
        words.forEach(word => {
          word.translationSummary = word.translationSummary[targetLanCode];
        });
        response.handleSuccess(res, {userWords: [], words});
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
              translations: summary,
              chapterSequences: word.chapterSequences
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
                translations: word.translationSummary,
                chapterSequences: word.chapterSequences
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
      });
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
  },
  addSession: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          sessionData = req.body.sessionData;
    sessionData.userId = userId;
    sessionData.dt = {
      start: Date.now(),
      end: Date.now(),
      diff: 0
    };
    const session = new Session(sessionData);
    session.save((err, result) => {
      log.logError(err, 'ERREXE09', 'addSession', `Error adding session for ${userId}, Status code: ${response && response.statusCode}`, 'flashcards');
      response.handleError(err, res, 400, 'Error saving new session data', () => {
        // also update date stamp userbook
        const query = {
                userId,
                bookId: sessionData.bookId,
                lanCode: sessionData.lanCode,
                isTest: sessionData.isTest,
                bookType: 'glossary'
              },
              update = {
                $set: {
                  'bookmark.lastGlossaryType': sessionData.glossaryType,
                  'bookmark.dt': sessionData.dt.end
                }
              }
        UserBook.updateOne(query, update, (err, result) => {
          response.handleError(err, res, 400, 'Error updating user userbook', () => {
            response.handleSuccess(res, false);
          });
        });
      });
    });
  },
  saveAnswers: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          targetLanCode = req.body.targetLanCode,
          bookLanCode = req.body.bookLanCode,
          flashcards = req.body.flashCardsToSave,
          glossaryType = req.body.glossaryType;
    if (flashcards.length > 0 && flashcards[0].answers) {
      let docs = flashcards.map(flashcard => {
        const wordId = new mongoose.Types.ObjectId(flashcard.wordId),
              translations = flashcard.translations.split(', ').join('|'),
              lastAnswer = flashcard.answers.slice(-1),
              answers = flashcard.answers,
              query = {
                wordId,
                bookId,
                userId,
                targetLanCode
              },
              mySet = {
                answersMy: answers,
                // answers: {$concat: [ "$answers", flashcard.answers]} // Only from v4.2 on
                lastAnswerMy: lastAnswer,
                dtFlashcard: new Date()
              },
              allSet = {
                answersAll: answers,
                // answers: {$concat: [ "$answers", flashcard.answers]} // Only from v4.2 on
                lastAnswerAll: lastAnswer,
                dtFlashcard: new Date()
              };
        return {
          updateOne: {
            filter: query,
            update: {
              $set: glossaryType === 'my' ? mySet: allSet ,
              $setOnInsert: {
                bookLanCode: bookLanCode,
                translations: translations,
                chapterSequences: flashcard.chapterSequences,
                pinned: false
              }
            },
            upsert: true
          }
        }
      });
      UserWordList.collection.bulkWrite(docs, (err, bulkResult) => {
        response.handleError(err, res, 400, 'Error saving flashcard answers', () => {
          response.handleSuccess(res, true);
        });
      });
    }
  },
  updateSummary: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.body.bookId),
          wordId = new mongoose.Types.ObjectId(req.body.wordId),
          targetLanCode = req.body.userLanCode,
          summary = req.body.summary,
          query = {
            _id: wordId,
            bookId
          },
          key = 'translationSummary.' + targetLanCode,
          update = {
            $set: {
              [key]: summary
            }
          };
    WordList.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error setting summary in word', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  excludeWord: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.body.bookId),
          wordId = new mongoose.Types.ObjectId(req.body.wordId),
          exclude = !!req.body.exclude,
          wordQuery = {
            _id: wordId,
            bookId
          },
          tlQuery = {
            wordId,
            bookId
          },
          update = {
            $set: {
              'exclude': exclude
            }
          };
    WordList.findOneAndUpdate(wordQuery, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating exclude in word', () => {
        WordTranslations.findOneAndUpdate(tlQuery, update, (err, result) => {
          response.handleError(err, res, 400, 'Error updating exclude in word translations', () => {
            response.handleSuccess(res, true);
          });
        });
      });
    });
  }
}
