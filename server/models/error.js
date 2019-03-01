'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var errorSchema = new Schema({
  code: String,
  src: String,
  msg: String,
  module: String,
  dt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Error', errorSchema);
