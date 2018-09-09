const response = require('../response'),
      mongoose = require('mongoose'),
      Book = require('../models/book').book,
      Chapter = require('../models/book').chapter,
      Translation = require('../models/book').translation,
      Session = require('../models/book').session,
      UserBook = require('../models/userbook').userBook,
      UserBookThumb = require('../models/userbook').userBookThumb,
      UserTrophy = require('../models/userbook').userTrophy,
      ErrorModel = require('../models/error'),
      wilson = require('wilson-score');

const setSessionDt = (startDate) => {
  return {
    start: startDate,
    end: Date.now(),
    diff: (new Date().getTime() - new Date(startDate).getTime()) / 1000
  };
}

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
    if (err) {
      console.log(`ERREXE06: Error saving wilson score for ${translationElementId}, ${translationElementId}`);
      const error = new ErrorModel({
        code: 'ERREXE06',
        src: 'updateWilsonScore',
        msg: `ERREXE06: Error saving wilson score for ${translationElementId}, ${translationElementId}`,
        module: 'books'});
      error.save(function(err, result) {});
    }
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
      console.log(`ERREXE05: Error finding data for wilson score for ${bookId}, ${translationElementId}, ${translationElementId}`);
      const error = new ErrorModel({
        code: 'ERREXE05',
        src: 'calculateWilsonScore',
        msg: `ERREXE05: Error finding data for wilson score for ${bookId}, ${translationElementId}, ${translationElementId}`,
        module: 'books'});
      error.save(function(err, result) {});
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
  existingTrophies = [];
  if (trophies && trophies.length) {
    userIdOnly = trophies.filter(t => t.userId.toString() === userId.toString());
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
    Session.count(query, (err, count) => {
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
  }
}

const checkTotalThumbTrophies = (res, userId, existingTrophies) => {
  // trophies 121, 122, 123
  if (!isInArray('121', existingTrophies) ||
      !isInArray('122', existingTrophies) ||
      !isInArray('123', existingTrophies)) {
    const query = {translatorId: userId, isOwnTranslation: false};
    // get all thumbs for one user
    UserBookThumb.count(query, (err, count) => {
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
    }
    Book.find(query, projection, options, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching books', () => {
        response.handleSuccess(res, books);
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
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, lanCode};
    UserBook.find(query, (err, books) => {
      response.handleError(err, res, 400, 'Error fetching user books', () => {
        response.handleSuccess(res, books);
      });
    });
  },
  getUserBook: (req, res) => {
    const bookId = req.params.bookId,
          lanCode = req.params.lan,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId, bookId, lanCode};
    UserBook.findOne(query, (err, book) => {
      response.handleError(err, res, 400, 'Error fetching user book', () => {
        response.handleSuccess(res, book);
      });
    });
  },
  getChapter: (req, res) => {
    const bookId = req.params.bookId,
          chapterId = req.params.chapterId,
          sequence = req.params.sequence ? parseInt(req.params.sequence) : 1,
          query = chapterId === '0' ? {bookId, sequence} : {_id: chapterId},
          projection = {content: 0};
    Chapter.findOne(query, projection, (err, chapter) => {
      response.handleError(err, res, 400, 'Error fetching chapter', () => {
        response.handleSuccess(res, chapter);
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
            elementId: "$translations._id"
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
          sentence = req.body.sentence,
          bookId = req.body.bookId,
          userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          newTranslation = {translation, note, lanCode, userId},
          query = {bookId, sentence},
          options = {upsert: true, new: true},
          update = {
            lanCode: bookLanCode,
            bookId,
            sentence,
            $push: {translations: {$each: [ newTranslation ], "$position": 0}}
          };
    Translation.findOneAndUpdate(query, update, options, (err, result) =>  {
      response.handleError(err, res, 400, 'Error adding translation', function() {
        const translationData = {
          translation: result.translations[0],
          translationsId: result._id
        }
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
      response.handleError(err, res, 400, 'Error updating translation', function() {
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
  updateBookmark: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          bookId = req.params.bookId,
          lanCode = req.params.lan,
          bookmark = req.body.bookmark,
          query = {bookId, userId, lanCode};
    bookmark.dt = Date.now()
    const update = {$set: {bookmark}};
    if (!bookmark.sentenceNrBook) {
      bookmark.sentenceNrBook = 0;
    }
    UserBook.findOneAndUpdate(query, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating bookmark', function() {
        response.handleSuccess(res, result);
      });
    });
  },
  addSession: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          sessionData = req.body.sessionData,
          startDate = req.body.startDate;
    sessionData.userId = userId;
    sessionData.dt = setSessionDt(startDate);
    session = new Session(sessionData);
    session.save(function(err, result) {
      response.handleError(err, res, 400, 'Error saving new session data', function(){
        response.handleSuccess(res, result._id);
      });
    });
  },
  updateSession: (req, res) => {
    const sessionData = req.body.sessionData,
          startDate = req.body.startDate;
    update = {$set: {
      answers: sessionData.answers,
      chapters: sessionData.chapters,
      nrYes: sessionData.nrYes,
      nrNo: sessionData.nrNo,
      nrMaybe: sessionData.nrMaybe,
      translations: sessionData.translations,
      dt: setSessionDt(startDate),
      points: sessionData.points
    }}
    Session.findByIdAndUpdate(sessionData._id, update, (err, result) => {
      response.handleError(err, res, 400, 'Error updating session', function() {
        response.handleSuccess(res, result);
      });
    });
  },
  getSessions: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          lanCode = req.params.lan,
          query = {userId, lanCode},
          projection = {
            _id: 0,
            bookId: '$_id',
            nrSentencesDone: 1,
            nrYes: 1,
            nrMaybe: 1,
            nrNo: 1
          },
          pipeline = [
            {$match: query},
            {$group: {
              _id: '$bookId',
              nrSentencesDone: {'$sum': { $strLenCP: "$answers" }},
              nrYes: {'$sum': "$nrYes" },
              nrMaybe: {'$sum': "$nrMaybe" },
              nrNo: {'$sum': "$nrNo" }
            }},
            {$project: projection}
          ];
    Session.aggregate(pipeline, (err, sessions) => {
      response.handleError(err, res, 400, 'Error fetching session data', function() {
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
      response.handleError(err, res, 400, 'Error fetching book session data', function() {
        const answers = sessions.map(s => s.answers);
        response.handleSuccess(res, answers);
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
        thumb = thumbCount.find( tc => tc.translationElementId.toString() === tu.translationElementId.toString());
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
          isOwnTranslation = userId.toString() === translatorId.toString();
          query = {userId, bookId, translationId, translationElementId},
          update = {$set: {up, isOwnTranslation}, $setOnInsert: {translatorId}},
          options = {upsert: true, new: true};
    console.log('userId', userId);
    console.log('translatorId', translatorId);
    console.log('isOwnTranslation', isOwnTranslation);
    UserBookThumb.findOneAndUpdate(query, update, options, (err, result) =>  {
      response.handleError(err, res, 400, 'Error saving thumb', function() {
        calculateWilsonScore(bookId, translationId, translationElementId);
        response.handleSuccess(res, result);
      });
    });
  },
  getTrophies: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          query = {userId},
          options = {};
    UserTrophy.find(query, {}, options, (err, trophies) =>  {
      response.handleError(err, res, 400, 'Error fetching trophies', function() {
        response.handleSuccess(res, trophies);
      });
    });
  },
  saveTrophies: (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.decoded.user._id),
          trophies = req.body.trophies;
    const trophyDocs = trophies.map(trophy => {return {userId, trophy};});
    UserTrophy.insertMany(trophyDocs, (err, result) => {
      response.handleError(err, res, 400, 'Error saving trophies', function() {
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
  }
}
