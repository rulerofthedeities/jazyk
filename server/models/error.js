var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var errorSchema = new Schema({
  code: String,
  src: String,
  msg: String,
  module: String,
  dt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('Error', errorSchema);
