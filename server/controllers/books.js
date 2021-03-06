'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      log = require('./log'),
      Book = require('../models/book').book,
      Chapter = require('../models/book').chapter,
      Sentence = require('../models/book').sentence,
      Translation = require('../models/book').translation,
      Session = require('../models/book').session,
      UserBook = require('../models/userbook').userBook,
      UserBookThumb = require('../models/userbook').userBookThumb,
      UserTrophy = require('../models/userbook').userTrophy,
      wilson = require('wilson-score'),
      request = require('request'),
      uuidv4 = require('uuid/v4');

const updateWilsonScore = (translation_id, translationElement_id, wilsonScore) => {
  const translationId = new mongoose.Types.ObjectId(translation_id),
        translationElementId = new mongoose.Types.ObjectId(translationElement_id),
        options = {},
        query = {
          _id: translationId,
          translations: {$elemMatch: {_id: translationElementId}},
        },
        update = {$set: {'translations.$.score': wilsonScore}};
  Translation.findOneAndUpdate(query, update, options, (err, result) => {
    log.logError(err, 'ERREXE06', 'updateWilsonScore', `Error saving wilson score for ${translationElementId}, ${translationElementId}`, 'books');
  });
}

const calculateWilsonScore = (book_id, translation_id, translationElement_id) => {
  const bookId = new mongoose.Types.ObjectId(book_id),
        translationId = new mongoose.Types.ObjectId(translation_id),
        translationElementId = new mongoose.Types.ObjectId(translationElement_id),
        query = {bookId, translationId, translationElementId},
        projection = {
          'translationElementId': '$_id',
          _id: 0,
          nrUp: 1,
          total: 1
        },
        countPipeline = [
          {$match: query},
          {$group: {
            _id: '$translationElementId',
            nrUp: {'$sum': {$cond: ["$up", 1, 0]}},
            total: {'$sum': 1}
          }},
          {$project: projection}
        ];
  // Get data for score calculation
  UserBookThumb.aggregate(countPipeline, (err, result) => {
    if (err) {
      log.logError(err, 'ERREXE05', 'calculateWilsonScore', `Error finding data for wilson score for ${bookId}, ${translationElementId}, ${translationElementId}`, 'books');
    } else {
      if (result && result[0]) {
        // Calculate score
        const wilsonScore = wilson(result[0].nrUp, result[0].total, 1.644853); // 95%, default is 99%
        // Update score for translation element
        updateWilsonScore(translationId, translationElementId, wilsonScore);
      }
    }
  });
}

const getExistingTrophies = (body, userId) => {
  const trophies = body.existingTrophies;
  let existingTrophies = [];
  if (trophies && trophies.length) {
    const userIdOnly = trophies.filter(t => t.userId.toString() === userId.toString());
    existingTrophies = userIdOnly.map(t => t.trophy);
  }
  return existingTrophies;
}

const checkTotalSessionTrophies = (res, userId, existingTrophies) => {
  // trophies 111, 112, 113
  if (!isInArray('111', existingTrophies) ||
      !isInArray('112', existingTrophies) ||
      !isInArray('113', existingTrophies)) {
    const query = {userId};
    Session.countDocuments(query, (err, count) => {
      response.handleError(err, res, 400, `Error counting total sessions for ${userId}`, () => {
        const trophiesToSave = [];
        if (count > 50 && !isInArray('111', existingTrophies)) {
          trophiesToSave.push('111');
        }
        if (count > 200 && !isInArray('112', existingTrophies)) {
          trophiesToSave.push('112');
        }
        if (count > 1000 && !isInArray('113', existingTrophies)) {
          trophiesToSave.push('113');
        }
        response.handleSuccess(res, trophiesToSave);
      });
    });
  } else {
    response.handleSuccess(res, []);
  }
}

const checkTotalThumbTrophies = (res, userId, existingTrophies) => {
  // trophies 121, 122, 123
  if (!isInArray('121', existingTrophies) ||
      !isInArray('122', existingTrophies) ||
      !isInArray('123', existingTrophies)) {
    const query = {translatorId: userId, isOwnTranslation: false};
    // get all thumbs for one user
    UserBookThumb.countDocuments(query, (err, count) => {
      response.handleError(err, res, 400, `Error counting total thumbs for ${userId}`, () => {
        const trophiesToSave = [];
        if (count > 100 && !isInArray('121', existingTrophies)) {
          trophiesToSave.push('121');
        }
        if (count > 500 && !isInArray('122', existingTrophies)) {
          trophiesToSave.push('122');
        }
        if (count > 2000 && !isInArray('123', existingTrophies)) {
          trophiesToSave.push('123');
        }
        response.handleSuccess(res, trophiesToSave);
      });
    })
  } else {
    response.handleSuccess(res, []);
  }
}

const isInArray = (value, array) => {
  return array.indexOf(value) > -1;
}


module.exports = {
  getPublishedLanBooks: (req, res) => {
    const lanCode = req.params.lan,
          sort = req.params.sort,
          bookType = req.params.bookType,
          query = {
            isPublished: true
          },
          projection = {
            categories: 0,
            img: 0,
            sourceLinkAudio: 0,
            sourceLink: 0,
            audioId: 0, // Link to audiobook
            links: 0,
            isLocked: 0,
            isSlang: 0,
            'difficulty.avgLongestSentences': 0,
            'difficulty.tpeMultiplicator': 0,
            'difficulty.slangMultiplicator': 0,
            'difficulty.avgLengthScore': 0,
            'difficulty.avgLength': 0,
            'difficulty.uniqueWordScore': 0,
            'difficulty.uniqueSentenceScore': 0,
            'difficulty.totalScore': 0,
            'difficulty.nrOfUniqueWords': 0
          };
    let options = {sort: {'difficulty.weight': 1}};
    if (lanCode !== 'eu') {
      query['lanCode'] = lanCode;
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
        options['sort'] = bookType === 'glossary' ? {'dt.publishedGlossary': -1} : (bookType === 'listen' ? {'dt.publishedAudio': -1} : {'dt.published': -1});
        break;
    }
    Book.find(query, projection, options, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching books', () => {
        response.handleSuccess(res, books);
      });
    });
  },
  getPublishedTypeBooks: (req, res) => {
    const lanCode = req.params.lan,
          bookType = req.params.bookType,
          query = {
            isPublished: true,
            lanCode: lanCode
          },
          options = {sort: {'difficulty.weight': 1}},
          projection = {
            sourceLinkAudio: 0,
            sourceLink: 0,
            audioId: 0, // Link to audiobook
            isLocked: 0,
            isSlang: 0,
            'difficulty.avgLongestSentences': 0,
            'difficulty.tpeMultiplicator': 0,
            'difficulty.slangMultiplicator': 0,
            'difficulty.avgLengthScore': 0,
            'difficulty.avgLength': 0,
            'difficulty.uniqueWordScore': 0,
            'difficulty.uniqueSentenceScore': 0,
            'difficulty.totalScore': 0,
            'difficulty.nrOfUniqueWords': 0
          };;
    if (bookType === 'listen') {
      query.audioPublished = true;
    }
    Book.find(query, projection, options, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching books', () => {
        response.handleSuccess(res, books);
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
      response.handleError(err, res, 400, 'Error fetching books count', () => {
        response.handleSuccess(res, result);
      });
    });
  },/*
  searchBooks: (req, res) => {
    const bookLanCode = req.params.lan,
          search = decodeURI(req.params.query),
          query = {
            lanCode: bookLanCode,
            $text: {
              $search: search,
              $caseSensitive: false
            }
          },
          projection = {
            score : {$meta: "textScore"}
          },
          options = {
            sort : {score : {$meta: "textScore" }}
          };
    Book.find(query, projection, options, (err, books) => {
      response.handleError(err, res, 400, 'Error searching books', () => {
        response.handleSuccess(res, books);
      });
    });
  },*/
  getBook: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          bookType = req.params.bookType,
          query = {
            _id: bookId,
            isPublished: true
          };
    if (bookType === 'listen') {
      query.audioPublished = true;
    } else if (bookType === 'glossary') {
      query.wordListPublished = true;
    }
    Book.findOne(query, (err, book) => {
      response.handleError(err, res, 400, 'Error fetching book', () => {
        response.handleSuccess(res, book);
      });
    });
  },
  getUserLanBooks: (req, res) => {
    const lanCode = req.params.lan,
          bookType = req.params.bookType,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {
            userId,
            lanCode,
            bookType
          };

    UserBook.find(query, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching user books', () => {
        response.handleSuccess(res, books);
      });
    });
  },
  getUserBook: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          lanCode = req.params.lan,
          bookType = req.params.bookType,
          isTest = req.params.isTest === '1' ? true : false,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, bookId, lanCode, bookType, isTest};
    UserBook.findOne(query, (err, book) => {
      response.handleError(err, res, 400, 'Error fetching user book', () => {
        response.handleSuccess(res, book);
      });
    });
  },
  getChapter: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          sequence = parseInt(req.params.sequence, 10) || 1,
          query = {
            bookId,
            sequence
          },
          projection = {
            content: 0
          };
    Chapter.findOne(query, projection, (err, chapter) => {
      response.handleError(err, res, 400, 'Error fetching chapter', () => {
        if (chapter) {
          const chapterId = new mongoose.Types.ObjectId(chapter._id);
          Sentence.find({bookId, chapterId}, {}, {sort: {sequence: 1}}, (err, sentences) => {
            response.handleError(err, res, 400, 'Error fetching chapter sentences', () => {
              response.handleSuccess(res, {chapter, sentences});
            });
          });
        } else {
          response.handleSuccess(res, null);
        }
      });
    });
  },
  getChapterHeaders: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          query = {bookId},
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
  },
  getTranslations: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
          lanCode = req.params.lan,
          chapterSequence = parseInt(req.params.chapterSequence, 10) || 0,
          sentence = req.params.sentence,
          query = {
            bookId,
            chapterSequence,
            sentence,
            'translations.lanCode': lanCode
          },
          projection = {
            translationId: "$_id",
            translation: "$translations.translation",
            note: "$translations.note",
            lanCode: "$translations.lanCode",
            score: "$translations.score",
            userId: "$translations.userId",
            elementId: "$translations._id",
            isMachine: "$translations.isMachine",
            isDuplicate: "$translations.isDuplicate",
            machine: "$translations.machine"
          },
          pipeline = [
            {$match: query},
            {$unwind: "$translations"},
            {$match: {'translations.lanCode': lanCode}},
            {$sort: {'translations.score': -1}},
            {$project: projection}
          ];
    Translation.aggregate(pipeline, (err, translations) => {
      response.handleError(err, res, 400, 'Error fetching sentence translations', () => {
        response.handleSuccess(res, translations);
      });
    });
  },
  addTranslation: (req, res) => {
    const translation = req.body.translation,
          note = req.body.note,
          lanCode = req.body.userLanCode,
          bookLanCode = req.body.bookLanCode,
          chapterSequence = req.body.chapterSequence,
          sentence = req.body.sentence,
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          isMachine = !!req.body.isMachine,
          machine = req.body.machine,
          isDuplicate = !!req.body.isDuplicate,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          newTranslation = {translation, note, lanCode, userId},
          query = {bookId, chapterSequence, sentence},
          options = {upsert: true, new: true};
    if (isMachine) {
      newTranslation['isMachine'] = true;
      newTranslation['isDuplicate'] = isDuplicate;
      newTranslation['machine'] = machine;
    };
    const update = {
            lanCode: bookLanCode,
            bookId,
            chapterSequence,
            sentence,
            $push: {translations: {$each: [ newTranslation ], "$position": 0}}
          };
    Translation.findOneAndUpdate(query, update, options, (err, result) =>  {
      response.handleError(err, res, 400, 'Error adding translation', () => {
        const translationData = {
          translation: result.translations[0],
          translationsId: result._id
        };
        response.handleSuccess(res, translationData);
      });
    });
  },
  updateTranslation: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          translationId = new mongoose.Types.ObjectId(req.body.translationId),
          translationElementId = new mongoose.Types.ObjectId(req.body.translationElementId),
          translation = req.body.translation,
          note = req.body.note,
          options = {new: true},
          query = {
            _id: translationId,
            translations: {$elemMatch: {userId, _id: translationElementId}},
          },
          update = {$set: {'translations.$.translation': translation, 'translations.$.note': note}};
    Translation.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error updating translation', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  getDeeplTranslation: (req, res) => {
    const lanFrom = req.body.lanPair.from.toUpperCase(),
          lanTo = req.body.lanPair.to.toUpperCase(),
          sentence = encodeURI(req.body.sentence.slice(0, 1600)), // limit to 1600 chars (url)
          api_key = process.env.DEEPL_API_KEY,
          url = `https://api.deepl.com/v2/translate?source_lang=${lanFrom}&target_lang=${lanTo}&split_sentences=0&text=${sentence}&auth_key=${api_key}`;

    request(url, (errDeepl, resDeepl, bodyDeepl) => {
      log.logError(errDeepl, 'ERREXE07', 'getDeeplTranslation', `Error fetching DeepL translation for ${sentence}, ${lanFrom} => ${lanTo} Status code: ${response && response.statusCode}`, 'books');
      response.handleError(errDeepl, resDeepl, 400, 'Error fetching DeepL translation', () => {
        response.handleSuccess(res, bodyDeepl);
      });
    }).end();
  },
  getMicrosoftTranslation: (req, res) => {
    const lanFrom = req.body.lanPair.from.toLowerCase(),
          lanTo = req.body.lanPair.to.toLowerCase(),
          sentence = req.body.sentence,
          api_key = process.env.MSTRANSLATE_API_KEY,
          options = {
            method: 'POST',
            baseUrl: 'https://api-eur.cognitive.microsofttranslator.com/',
            url: 'translate',
            qs: {
              'api-version': '3.0',
              'from': lanFrom,
              'to': lanTo
            },
            headers: {
              'Ocp-Apim-Subscription-Key': api_key,
              'Content-type': 'application/json',
              'X-ClientTraceId': uuidv4().toString()
            },
            body: [{
              'text': sentence
            }],
            json: true,
          };
    request(options, (errMS, resMS, bodyMS) => {
      response.handleError(errMS, resMS, 400, 'Error fetching DeepL translation', () => {
        response.handleSuccess(res, bodyMS);
      });
    });
  },
  updateBookmark: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          lanCode = req.body.lanCode,
          isTest = req.body.isTest,
          bookType = req.body.bookType,
          bookmark = req.body.bookmark,
          query = {bookId, userId, lanCode, bookType, isTest};
    bookmark.dt = Date.now();
    const update = {$set: {bookmark}};
    UserBook.findOneAndUpdate(query, update, (err, result) => {
      log.logError(err, 'ERREXE08', 'updateBookmark', `Error updating bookmark for ${bookId}, ${userId}, ${lanCode}, ${bookType}, ${isTest}, Status code: ${response && response.statusCode}`, 'books');
      response.handleError(err, res, 400, 'Error updating bookmark', () => {
        response.handleSuccess(res, result);
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
      log.logError(err, 'ERREXE09', 'addSession', `Error adding session for ${userId}, Status code: ${response && response.statusCode}`, 'books');
      response.handleError(err, res, 400, 'Error saving new session data', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  updateSession: (req, res) => {
    const sessionData = req.body.sessionData,
          update = {$set: {
            answers: sessionData.answers,
            nrYes: sessionData.nrYes,
            nrNo: sessionData.nrNo,
            nrMaybe: sessionData.nrMaybe,
            translations: sessionData.translations,
            lastChapterId: sessionData.lastChapterId,
            lastChapterSequence: sessionData.lastChapterSequence,
            lastSentenceNrChapter: sessionData.lastSentenceNrChapter,
            'dt.end': Date.now(),
            'dt.diff': (new Date().getTime() - new Date(sessionData.dt.start).getTime()) / 1000,
            points: sessionData.points
          }};
    Session.findByIdAndUpdate(sessionData._id, update, (err, result) => {
      log.logError(err, 'ERREXE10', 'updateSession', `Error updating session for session id ${sessionData._id}, Status code: ${response && response.statusCode}`, 'books');
      response.handleError(err, res, 400, 'Error updating session', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  changeSessionAnswer: (req, res) => {
    const sessionData = req.body.sessionData,
          update = {$set: {
            answers: sessionData.answers,
            nrYes: sessionData.nrYes,
            nrNo: sessionData.nrNo,
            nrMaybe: sessionData.nrMaybe
          }};
    Session.findByIdAndUpdate(sessionData._id, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating session change', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getBookSessions: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = new mongoose.Types.ObjectId(req.params.bookId),
          bookType = req.params.bookType,
          userLanCode = req.params.lan,
          query = {userId, bookId, bookType, lanCode: userLanCode},
          projection = {answers: 1, _id: 0},
          options = {sort: {'dt.end': 1}};
    Session.find(query, projection, options, (err, sessions) => {
      response.handleError(err, res, 400, 'Error fetching book session data', () => {
        const answers = sessions.map(s => s.answers);
        response.handleSuccess(res, answers);
      });
    });
  },
  getLastestSession: (req, res) => {
    const bookId = new mongoose.Types.ObjectId(req.params.bookId),
    userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lanCode = req.params.lan,
          bookType = req.params.bookType,
          isTest = req.params.isTest === '1' ? true : false,
          query = {userId, bookId, bookType, lanCode, isTest},
          projection = {},
          options = {sort: {'dt.end': -1}};
    Session.findOne(query, projection, options, (err, session) => {
      response.handleError(err, res, 400, 'Error fetching latest session data', () => {
        response.handleSuccess(res, session);
      });
    });
  },
  getThumbs: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId =new mongoose.Types.ObjectId( req.params.bookId),
          translationId = new mongoose.Types.ObjectId(req.params.translationId),
          countQuery = {bookId, translationId},
          userQuery = {bookId, userId, translationId},
          projection = {
            'translationElementId': '$_id',
            _id: 0,
            nrUp: 1,
            nrDown: 1
          },
          countPipeline = [
            {$match: countQuery},
            {$group: {
              _id: '$translationElementId',
              nrUp: {'$sum': {$cond: ["$up", 1, 0]}},
              nrDown: {'$sum': {$cond: [{$eq: ["$up", false]}, 1, 0]}} // can be null
            }},
            {$project: projection}
          ],
          userPipeline = [
            {$match: userQuery},
            {$group: {
              _id: '$translationElementId',
              nrUp: {'$sum': {$cond: ["$up", 1, 0]}},
              nrDown: {'$sum': {$cond: [{$eq:["$up", false]}, 1, 0]}} // can be null
            }},
            {$project: projection}
          ];

    const getThumbs = async () => {
      const thumbCount = await UserBookThumb.aggregate(countPipeline),
            thumbUser = await UserBookThumb.aggregate(userPipeline);
      thumbUser.forEach(tu => {
        const thumb = thumbCount.find( tc => tc.translationElementId.toString() === tu.translationElementId.toString());
        if (thumb) {
          thumb.user = tu.nrUp > 0 ? true : (tu.nrDown > 0 ? false : null);
        }
      });
      return {thumbCount};
    };

    getThumbs().then((results) => {
      response.handleSuccess(res, results ? results.thumbCount : []);
    }).catch((err) => {
      response.handleError(err, res, 500, 'Error fetching thumbs');
    });
  },
  addThumb: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          up = req.body.up,
          bookId = new mongoose.Types.ObjectId(req.body.bookId),
          translatorId = new mongoose.Types.ObjectId(req.body.translatorId),
          translationId = new mongoose.Types.ObjectId(req.body.translationId),
          translationElementId = new mongoose.Types.ObjectId(req.body.translationElementId),
          isOwnTranslation = userId.toString() === translatorId.toString(),
          query = {
            userId,
            bookId,
            translationId,
            translationElementId
          },
          update = {
            $set: {up, isOwnTranslation},
            $setOnInsert: {translatorId}
          },
          options = {upsert: true, new: true};
    UserBookThumb.findOneAndUpdate(query, update, options, (err, result) =>  {
      response.handleError(err, res, 400, 'Error saving thumb', () => {
        calculateWilsonScore(bookId, translationId, translationElementId);
        response.handleSuccess(res, result);
      });
    });
  },
  getTrophies: (req, res) => {
    const user = req.params.userId,
          userId = user ? new mongoose.Types.ObjectId(user) : new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId},
          options = {};
    UserTrophy.find(query, {}, options, (err, trophies) =>  {
      response.handleError(err, res, 400, 'Error fetching trophies', () => {
        response.handleSuccess(res, trophies);
      });
    });
  },
  saveTrophies: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          trophies = req.body.trophies,
          trophyDocs = trophies.map(trophy => {
            return {userId, trophy};
          });
    UserTrophy.insertMany(trophyDocs, (err, result) => {
      response.handleError(err, res, 400, 'Error saving trophies', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getSessionTrophies: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          existingTrophies = getExistingTrophies(req.body, userId);
    checkTotalSessionTrophies(res, userId, existingTrophies);
  },
  getThumbTrophies: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          existingTrophies = getExistingTrophies(req.body, userId);
    checkTotalThumbTrophies(res, userId, existingTrophies);
  },
  subscribeToBook: (req, res) => {
    const userId = req.decoded.user._id,
          data = req.body;
    if (data && data.bookId) {
      const bookId = new mongoose.Types.ObjectId(data.bookId),
            lanCode = data.lanCode,
            bookType = data.bookType,
            isTest = data.isTest,
            query = {userId, bookId, lanCode, bookType, isTest},
            options = {upsert: true, new: true},
            insert = {userId, bookId, lanCode, bookType, isTest, 'dt.dtSubscribed': Date.now()},
            set = {subscribed: true, 'dt.dtLastReSubscribed': Date.now()},
            update = {$set: set, $setOnInsert: insert};
      UserBook.findOneAndUpdate(query, update, options, (err, result) => {
        response.handleError(err, res, 400, 'Error subscribing to book', () => {
          response.handleSuccess(res, result);
        });
      });
    } else {
      response.handleSuccess(res, {}, 200);
    }
  },
  setBookFinished: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          data = req.body;
    if (data && data.bookId) {
      const bookId = new mongoose.Types.ObjectId(data.bookId),
            lanCode = data.lanCode,
            bookType = data.bookType,
            isTest = data.isTest,
            points = data.finishedPoints,
            query = {userId, bookId, lanCode, bookType, isTest},
            optionsBook = {new: true},
            optionsSession = {sort: {'dt.end': -1}, new: true},
            updateUserBook = {$set: {'bookmark.isBookRead': true}},
            updateUserSession = {$set: {'points.finished': points}};
      UserBook.findOneAndUpdate(query, updateUserBook, optionsBook, (err, ubook) => {
        response.handleError(err, res, 400, 'Error setting book to finished', () => {
          Session.findOneAndUpdate(query, updateUserSession, optionsSession, (err, session) => {
            response.handleError(err, res, 400, 'Error setting session finished points', () => {
              response.handleSuccess(res, {ubook, session});
            });
          })
        });
      });
    } else {
      response.handleSuccess(res, {}, 200);
    }
  },
  subscribeRepeat: (req, res) => {
    // add bookmark dt to repeats
    // increase repeatCount
    // remove bookmark
    // set subscribed to true
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          data = req.body,
          bookId = new mongoose.Types.ObjectId(data.bookId),
          lanCode = data.lanCode,
          bookType = data.bookType,
          isTest = data.isTest,
          dt = data.bookmark ? data.bookmark.dt : Date.now(),
          query = {userId, bookId, lanCode, bookType, isTest},
          update = {
            $set: {
              bookmark: {
                isChapterRead: false,
                isBookRead: false,
                dt: Date.now(),
                chapterId: null,
                chapterSequence: 1,
                sentenceNrChapter: 0
              }
            },
            $inc: {repeatCount: 1},
            $push: {repeats: dt},
            subscribed: true,
            'dt.dtLastReSubscribed': Date.now()
          },
          options= {isNew: true};
    UserBook.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error subscribing repeat', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  recommend: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          ubookId = new mongoose.Types.ObjectId(req.body.ubookId),
          query = {
            _id: ubookId,
            userId
          },
          options = {},
          update = {$set: {
            recommended: true
          }};
    UserBook.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error recommending book', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  unsubscribeFromBook: (req, res) => {
    const userId =  new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId =  new mongoose.Types.ObjectId(req.body.bookId),
          targetLanCode = req.body.targetLanCode,
          query = {
            bookId,
            userId,
            lanCode: targetLanCode
          },
          update = {$set: {
            subscribed: false,
            'dt.dtLastUnSubscribed': Date.now()
          }};
    UserBook.updateMany(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error unsubscribing from book', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  unRecommend: (req, res) => {
    const userId =  new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId =  new mongoose.Types.ObjectId(req.body.bookId),
          targetLanCode = req.body.targetLanCode,
          query = {
            bookId,
            userId,
            lanCode: targetLanCode
          },
          update = {$set: {
            recommended: false
          }};
    UserBook.updateMany(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error unrecommending from book', () => {
        response.handleSuccess(res, true);
      });
    });
  }
}
