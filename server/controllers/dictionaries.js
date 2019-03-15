'use strict';

const response = require('../response'),
      mongoose = require('mongoose'),
      request = require('request'),
      Definitions = require('../models/wordlist').definitions,
      Translations = require('../models/wordlist').translations;

const fetchOmegawikiData = (url) => {
  console.log('URL', url);
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
          console.log('word>', word);
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
          word = req.body.word,
          translations = req.body.translations,
          query = {lanCode, word},
          update = {$addToSet: {translations: {$each: translations}}};
    Translations.findOneAndUpdate(query, update, {upsert: true}, (err, result) => {
      response.handleError(err, res, 400, 'Error saving word translation', () => {
        response.handleSuccess(res, result);
      });
    });
  },
  getTranslations: (req, res) => {
    const lanCode = req.body.lanCode,
          words = req.body.words,
          query = {lanCode, word: {$in: words}};
    console.log('fetching translations for ', lanCode, words);
    Translations.find(query, (err, translations) => {
      console.log('translations', translations);
      response.handleError(err, res, 400, 'Error fetching word translations', () => {
        response.handleSuccess(res, translations);
      });
    });
  },
  getOmegawikiTranslation: (req, res) => {
    const lanId = req.params.lanId,
          word = req.params.word,
          url = 'http://www.omegawiki.org/api.php?action=ow_define&lang=86&dm=6551&format=json';
    console.log('fetching translation', url);

    fetchOmegawikiData(url).then((data) => {
      response.handleSuccess(res, data, 200, 'Fetched external omegawiki translations');
      console.log('omega translation', data);
    }, (err) => {
      response.handleError(err, res, 500, 'Error fetching external omegawiki translations');
    });
  }
}
