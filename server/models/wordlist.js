'use strict';

const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const WordSchema = new Schema({}, { strict: false }),
      WordModel = mongoose.model('bookword', WordSchema);

module.exports = {
  'word': WordModel
};
