const response = require('../response'),
      Config = require('../models/config'),
      Translation = require('../models/translation');

module.exports = {
  getWelcomeMessage: (req, res) => {
    const lanCode = req.params.lan,
          query = {tpe:'notification', code: lanCode, name: 'welcome'},
          projection = {_id: 0, title: 1, message: 1};
    Config.findOne(query, projection, function(err, message) {
      response.handleError(err, res, 400, 'Error fetching notification message', function(){
        response.handleSuccess(res, message);
      });
    });
  },
  getDependables: (req, res) => {
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
          intLanguagesPipeline = [
            {$match: {tpe: 'language', interface: true}},
            {$project: {
              _id: 0,
              code: 1,
              name: 1,
              nativeName: 1,
              interface: 1,
              active: 1,
              articles: 1,
              regions: 1
            }}
          ],
          userLanguagesPipeline = [
            {$match: {tpe: 'language', user: true, active: true}},
            {$project: {
              _id: 0,
              code: 1,
              name: 1,
              nativeName: 1,
              active: 1
            }},
            {$sort: {code: 1}}
          ],
          bookLanguagesPipeline = [
            {$match: {tpe: 'language', book: true, active: true}},
            {$project: {
              _id: 0,
              code: 1,
              name: 1,
              nativeName: 1,
              active: 1
            }},
          {$sort: {code: 1}}
        ];
    const getData = async () => {
      let translations, languages, userLanguages, bookLanguages, licenseUrls;
      if (params.getTranslations === 'true') {
        translations = await Translation.aggregate(translationPipeline);
      }
      if (params.getLanguages === 'true') {
        languages = await Config.aggregate(intLanguagesPipeline);
        userLanguages = await Config.aggregate(userLanguagesPipeline);
        bookLanguages = await Config.aggregate(bookLanguagesPipeline);
      }
      if (params.getLicenses === 'true') {
        licenseUrls = await Config.find({tpe: 'license'}, {_id: 0, license: 1, url: 1});
      }

      return {translations, languages, userLanguages, bookLanguages, licenseUrls};
    };

    getData().then((results) => {
      response.handleSuccess(res, results);
    }).catch((err) => {
      response.handleError(err, res, 400, 'Error fetching dependables');
    });
  }
}
