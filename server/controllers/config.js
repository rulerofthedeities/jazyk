const response = require('../response'),
      mongoose = require('mongoose'),
      Config = require('../models/lanconfig'),
      Translation = require('../models/translation');

module.exports = {
  getLanConfig: function(req, res) {
    const lanCode = req.params.lan,
          query = {tpe:'language', code: lanCode};
    Config.findOne(query, function(err, config) {
      response.handleError(err, res, 400, 'Error fetching lan config', function(){
        response.handleSuccess(res, config);
      });
    });
  },
  getLanPairConfig: function(req, res) {
    const lanLocal = req.params.lanLocal,
          lanForeign = req.params.lanForeign,
          queryLocal = {tpe:'language', code: lanLocal},
          queryForeign = {tpe:'language', code: lanForeign};

    const getConfigs = async () => {
      const local = await Config.findOne(queryLocal),
            foreign = await Config.findOne(queryForeign);
      return {local, foreign};
    };

    getConfigs().then((results) => {
      response.handleSuccess(res, results);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching configs');
    });
  },
  getWelcomeMessage: function(req, res) {
    const lanCode = req.params.lan,
          query = {tpe:'notification', code: lanCode, name: 'welcome'},
          projection = {_id: 0, title: 1, message: 1};
    Config.findOne(query, projection, function(err, message) {
      response.handleError(err, res, 400, 'Error fetching notification message', function(){
        response.handleSuccess(res, message);
      });
    });
  },
  getDependables: function(req, res) {
    const params = req.query,
          lan = params.lan,
          translationPipeline = [
            {$match: {components: params.component}},
            {$project: {
              _id: 0,
              key: 1,
              txt: '$' + lan
            }}
          ],
          languagesPipeline = [
            {$match: {tpe: 'language'}},
            {$project: {
              _id: 0,
              code: 1,
              name: 1,
              nativeName: 1,
              interface: 1,
              active: 1,
              articles: 1,
              regions: 1
            }},
            {$sort: {code: 1}}
          ];
    const getData = async () => {
      let translations, languages;
      if (params.getTranslations === 'true') {
        translations = await Translation.aggregate(translationPipeline);
      }
      if (params.getLanguages === 'true') {
        languages = await Config.aggregate(languagesPipeline);
      }
      return {translations, languages};
    };

    getData().then((results) => {
      response.handleSuccess(res, results);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching dependables');
    });
  }
}
