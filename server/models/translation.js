var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var translationSchema = new Schema({
  components: [String],
  key: String,
  en: String,
  nl: String,
  fr: String
});

module.exports = mongoose.model('Translation', translationSchema);
