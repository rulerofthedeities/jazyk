'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      request = require('request'),
      Definitions = require('../models/wordlist').definitions,
      Translations = require('../models/wordlist').translations;

const fetchOmegawikiData = (url) => {
  return new Promise((resolve, reject) => {
    request({
      url: url,
      headers: {
        'User-Agent': 'kmodo / kristiaan@yahoo.com'
      },
      agentOptions: {
        rejectUnauthorized: false
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        reject(`Error: Unable to connect to "${url}".`);
      } else {
        resolve({
          omega: body
        });
      }
    });
  });
}

const getSortWord = (word) => {
  // replace all diacritics with standard letters for sorting
  const sortWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return sortWord;
};

module.exports = {
  getOmegawikiDefinitionsLocal: (req, res) => {
    const query = {
      source: 'OmegaWiki',
      word: req.params.word
    };
    Definitions.findOne(query, (err, result) => {
      response.handleError(err, res, 400, 'Error fetching omegawiki word definition', () => {
        response.handleSuccess(res, result ? result.omegaDefinitions : []);
      });
    });
  },
  getOmegawikiDefinitionsExt: (req, res) => {
    const word = req.params.word,
          url = `http://www.omegawiki.org/api.php?action=ow_express&search=${word}&format=json`;
    fetchOmegawikiData(url).then((data) => {
      response.handleSuccess(res, data, 200, 'Fetched external omegawiki definitions');
    }, (err) => {
      response.handleError(err, res, 500, 'Error fetching external omegawiki definitions');
    });
  },
  saveOmegaDefinitions: (req, res) => {
    const definitionsData = req.body.definitions,
          definitions = new Definitions(definitionsData);
    definitions.save((err, result) => {
      response.handleError(err, res, 400, 'Error saving new omegawiki definitions data', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  saveTranslation: (req, res) => {
    const lanCode = req.body.bookLanCode,
          bookId = req.body.bookId,
          word = req.body.word,
          sortWord = getSortWord(word.word),
          translations = req.body.translations,
          query = {
            bookId,
            wordId: word._id,
            lanCode
          },
          update = {
            sortWord,
            word: word.word,
            $addToSet: {translations: {$each: translations}}
          },
          options = {
            upsert: true,
            new: true
          };
    Translations.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error saving word translation', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  updateTranslation: (req, res) => {
    const wordId = new mongoose.Types.ObjectId(req.body.wordId),
          translationElementId = new mongoose.Types.ObjectId(req.body.translationElementId),
          translation = req.body.translation,
          note = req.body.note,
          options = {new: true},
          query = {
            wordId: wordId,
            translations: {$elemMatch: {_id: translationElementId}},
          },
          update = {$set: {'translations.$.translation': translation, 'translations.$.definition': note}};
    Translations.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error updating word translation', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  removeTranslation: (req, res) => {
    const wordId = new mongoose.Types.ObjectId(req.body.wordId),
          translationElementId = new mongoose.Types.ObjectId(req.body.translationElementId),
          options = {multi: false},
          query = {
            wordId: wordId
          },
          update = {$pull: {'translations': {'_id': translationElementId}}};
    Translations.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error removing word translation', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  setNoneTranslation: (req, res) => {
    const wordId = new mongoose.Types.ObjectId(req.body.wordId),
          source = req.body.source,
          lanCode = req.body.lanCode,
          options = {multi: false},
          query = {wordId},
          translation = {
            "translation" : "<none>",
            "lanCode" : lanCode,
            "source" : source
          },
          update = {$addToSet: {translations: translation}};
    Translations.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error setting word translation to none', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  translationtonone: (req, res) => {
    const wordId = new mongoose.Types.ObjectId(req.body.wordId),
          translationElementId = new mongoose.Types.ObjectId(req.body.translationElementId),
          options = {
            multi: false
          },
          query = {
            wordId: wordId,
            translations: {$elemMatch: {_id: translationElementId}},
          },
          update = {$set: {'translations.$.translation': '<none>'}};
    Translations.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error setting word translation to none', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  translationToLower: (req, res) => {
    const wordId = new mongoose.Types.ObjectId(req.body.wordId),
          translationElementId = new mongoose.Types.ObjectId(req.body.translationElementId),
          newTranslation = req.body.newTranslation,
          options = {
            multi: false
          },
          query = {
            wordId: wordId,
            translations: {$elemMatch: {_id: translationElementId}},
          },
          update = {$set: {'translations.$.translation': newTranslation}};
    Translations.findOneAndUpdate(query, update, options, (err, result) => {
      response.handleError(err, res, 400, 'Error setting word translation to lowercase', () => {
        response.handleSuccess(res, true);
      });
    });
  },
  /*
  getLetterTranslations: (req, res) => {
    const bookLan = req.body.bookLan,
          bookId = req.body.bookId,
          targetLan = req.body.targetLan,
          firstLetter = req.body.letter,
          query = {
            bookId,
            lanCode: bookLan,
            sortWord: {$regex: '^' + firstLetter, $options:'i'},
            'translations.lanCode': targetLan
          };
    Translations.find(query, (err, translations) => {
      response.handleError(err, res, 400, `Error fetching word translations for letter ${firstLetter}`, () => {
        response.handleSuccess(res, translations);
      });
    });
  },
  */
  getAllTranslations: (req, res) => {
    const bookLan = req.body.bookLan,
          bookId = req.body.bookId,
          targetLan = req.body.targetLan,
          query = {
            bookId,
            lanCode: bookLan,
            'translations.lanCode': targetLan
          };
    Translations.find(query, (err, translations) => {
      response.handleError(err, res, 400, `Error fetching word translations`, () => {
        response.handleSuccess(res, translations);
      });
    });
  },
  getOmegawikiTranslation: (req, res) => {
    const lanId = req.params.lanId,
          dmid = req.params.dmid,
          url = `http://www.omegawiki.org/api.php?action=ow_define&lang=${lanId}&dm=${dmid}&format=json`;

    fetchOmegawikiData(url).then((data) => {
      const translation = data ? (data['omega'] ? data['omega']['ow_define'] : {}) : {};
      response.handleSuccess(res, {TL: translation});
    }, (err) => {
      response.handleError(err, res, 500, 'Error fetching external omegawiki translations');
    });
  }
}
