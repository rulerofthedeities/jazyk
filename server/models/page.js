var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var pageSchema = new Schema({
  tpe: {type: String, required: true},
  lan: {type: String, required: true},
  name: {type: String, required: true},
  title: String,
  text: String,
  html: String,
  index: {type: Boolean, default: true}
});

module.exports = mongoose.model('Page', pageSchema);
