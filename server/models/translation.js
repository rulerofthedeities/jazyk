'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var translationSchema = new Schema({
  components: [String],
  key: String,
  en: String,
  nl: String,
  fr: String
});

translationSchema.index({components: 1});
const translationModel = mongoose.model('Translation', translationSchema);
translationModel.ensureIndexes();

module.exports = translationModel;
