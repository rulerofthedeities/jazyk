var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var logSchema = new Schema({
  page: {type: String, required: true},
  year: {type: Number, required: true},
  month: {type: Number, required: true},
  day: {type: Number, required: true},
  count: {type: Number, default: 1}
});

module.exports = mongoose.model('Log', logSchema);
