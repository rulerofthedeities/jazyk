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
        console.log('saved omegawiki definitions', result);
        response.handleSuccess(res, result);
      });
    });
  },
  saveTranslation: (req, res) => {
    const lanCode = req.body.bookLanCode,
          bookId = req.body.bookId,
          word = req.body.word,
          translations = req.body.translations,
          query = {bookId, lanCode, word},
          update = {$addToSet: {translations: {$each: translations}}};
    Translations.findOneAndUpdate(query, update, {upsert: true}, (err, result) => {
      response.handleError(err, res, 400, 'Error saving word translation', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getTranslations: (req, res) => {
    const bookLan = req.body.bookLan,
          bookId = req.body.bookId,
          targetLan = req.body.targetLan,
          words = req.body.words,
          query = {bookId, lanCode: bookLan, word: {$in: words}, 'translations.lanCode': targetLan};
    console.log('fetching translations for ', bookLan, targetLan, words);
    console.log('fetching translations ', query);
    Translations.find(query, (err, translations) => {
      console.log('translations', translations);
      response.handleError(err, res, 400, 'Error fetching word translations', () => {
        response.handleSuccess(res, translations);
      });
    });
  },
  getOmegawikiTranslation: (req, res) => {
    const lanId = req.params.lanId,
          dmid = req.params.dmid,
          url = `http://www.omegawiki.org/api.php?action=ow_define&lang=${lanId}&dm=${dmid}&format=json`;

    fetchOmegawikiData(url).then((data) => {
      console.log('omega translation data', data);
      const translation = data ? (data['omega'] ? data['omega']['ow_define'] : {}) : {};
      console.log('omega translation', translation);
      response.handleSuccess(res, {TL: translation});
    }, (err) => {
      response.handleError(err, res, 500, 'Error fetching external omegawiki translations');
    });
  }
}
