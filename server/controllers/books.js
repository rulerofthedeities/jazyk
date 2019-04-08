'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      log = require('./log'),
      Book = require('../models/book').book,
      Chapter = require('../models/book').chapter,
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
  },
  getBook: (req, res) => {
    const bookId = req.params.bookId,
          query = {_id: bookId, isPublished: true};
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
          query = {userId, lanCode, bookType};

    UserBook.find(query, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching user books', () => {
        response.handleSuccess(res, books);
      });
    });
  },
  getActivity: (req, res) => {
    const lanCode = req.params.lan,
          bookType = req.params.bookType,
          query = {bookType},
          projection = {
            _id: 0,
            bookId: '$_id.bookId',
            recommended: 1,
            started: 1,
            finished: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: {
                bookId: '$bookId'
              },
              recommended: {
                $sum: { $cond: ["$recommended", 1, 0] }
              },
              started: {
                $sum: { $cond: [{'$ifNull': ['$bookmark', false]}, 1, 0] }
              },
              finished: {
                $sum: { $cond: [{'$eq': ['$bookmark.isBookRead', true]}, 1, 0] }
              }
            }},
            {$project: projection}
          ];
      UserBook.aggregate(pipeline, (err, activity) => {
      response.handleError(err, res, 400, 'Error fetching user books activity', () => {
        response.handleSuccess(res, activity);
      });
    });
  },
  getUserBook: (req, res) => {
    const bookId = req.params.bookId,
          lanCode = req.params.lan,
          isTest = req.params.isTest === '1' ? true : false,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, bookId, lanCode, isTest};
    UserBook.findOne(query, (err, book) => {
      response.handleError(err, res, 400, 'Error fetching user book', () => {
        response.handleSuccess(res, book);
      });
    });
  },
  getChapter: (req, res) => {
    const bookId = req.params.bookId,
          sequence = parseInt(req.params.sequence, 10) || 1,
          query = {bookId, sequence},
          projection = {content: 0};
    Chapter.findOne(query, projection, (err, chapter) => {
      response.handleError(err, res, 400, 'Error fetching chapter', () => {
        response.handleSuccess(res, chapter);
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
          sentence = req.params.sentence,
          query = {bookId, sentence, 'translations.lanCode': lanCode},
          projection = {
            _id: 1,
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
          bookId = req.body.bookId,
          isMachine = !!req.body.isMachine,
          machine = req.body.machine,
          isDuplicate = !!req.body.isDuplicate,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          newTranslation = {translation, note, lanCode, userId},
          query = {bookId, sentence},
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
  getBookTranslations: (req, res) => {
    const userLan = req.params.lan,
          query = {'translations.lanCode': userLan},
          projection = {
            _id: 0,
            bookId: '$_id',
            count: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: '$bookId',
              count: {'$sum': 1}
            }},
            {$project: projection}
          ];
    Translation.aggregate(pipeline, (err, translations) => {
      response.handleError(err, res, 400, 'Error fetching translations count', () => {
        response.handleSuccess(res, translations);
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
          bookId = req.body.bookId,
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
  getSessions: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lanCode = req.params.lan,
          bookType = req.params.bookType,
          query = {userId, lanCode, bookType},
          projection = {
            _id: 0,
            bookId: '$_id.bookId',
            isTest: '$_id.isTest',
            repeatCount: '$_id.repeat',
            nrSentencesDone: 1,
            nrYes: 1,
            nrMaybe: 1,
            nrNo: 1,
            start: 1,
            end: 1
          },
          pipeline = [
            {$match: query},
            {$sort: {'dt.start': 1}},
            {$group: {
              _id: {
                bookId: '$bookId',
                isTest: '$isTest',
                repeat: '$repeatCount'
              },
              nrSentencesDone: {'$sum': { $strLenCP: "$answers" }},
              nrYes: {'$sum': "$nrYes" },
              nrMaybe: {'$sum': "$nrMaybe" },
              nrNo: {'$sum': "$nrNo" },
              start: {$first: '$dt.start'},
              end: {$last: '$dt.end'}
            }},
            {$project: projection}
          ];
    Session.aggregate(pipeline, (err, sessions) => {
      response.handleError(err, res, 400, 'Error fetching session data', () => {
        response.handleSuccess(res, sessions);
      });
    });
  },
  getBookSessions: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = req.params.bookId,
          userLanCode = req.params.lan,
          query = {userId, bookId, lanCode: userLanCode},
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
    const bookId = req.params.bookId,
          lanCode = req.params.lan,
          isTest = req.params.isTest === '1' ? true : false,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, bookId, lanCode, isTest},
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
          bookId = req.body.bookId,
          translatorId = req.body.translatorId,
          translationId = req.body.translationId,
          translationElementId = req.body.translationElementId,
          isOwnTranslation = userId.toString() === translatorId.toString(),
          query = {userId, bookId, translationId, translationElementId},
          update = {$set: {up, isOwnTranslation}, $setOnInsert: {translatorId}},
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
      const bookId = mongoose.Types.ObjectId(data.bookId),
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
    const userId = req.decoded.user._id,
          data = req.body;
    if (data && data.bookId) {
      const bookId = mongoose.Types.ObjectId(data.bookId),
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
    const userId = req.decoded.user._id,
          data = req.body,
          bookId = mongoose.Types.ObjectId(data.bookId),
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
  unsubscribeFromBook: (req, res) => {
    const userId = req.decoded.user._id,
          ubookId = req.body.ubookId,
          query = {_id: ubookId, userId},
          options = {new: true},
          set = {subscribed: false, 'dt.dtLastUnSubscribed': Date.now()},
          update = {$set: set};
    UserBook.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error unsubscribing from book', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  recommend: (req, res) => {
    const userId = req.decoded.user._id,
          ubookId = req.body.ubookId,
          recommended = req.body.recommend,
          query = {_id: ubookId, userId},
          options = {},
          update = {$set: {recommended}};
    UserBook.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error recommending book', () => {
        response.handleSuccess(res, result);
      });
    });
  }
}
