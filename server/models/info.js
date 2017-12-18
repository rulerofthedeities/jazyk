var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var infoLanSchema = new Schema({
  title: {type: String, required: true},
  content: String
}, {_id: false});

var infoSchema = new Schema({
  nl: infoLanSchema,
  fr: infoLanSchema,
  en: infoLanSchema
});

module.exports = mongoose.model('Info', infoSchema);
