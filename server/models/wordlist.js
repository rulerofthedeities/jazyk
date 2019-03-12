'use strict';

const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const WordSchema = new Schema({}, { strict: false }),
      WordModel = mongoose.model('bookword', WordSchema);

const userWordSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  userId: {type: Schema.Types.ObjectId, required: true},
  wordId: {type: Schema.Types.ObjectId, required: true},
  lanCode: String,
  pinned: Boolean
});

userWordSchema.index({userId: 1, bookId: 1, lanCode: 1, pinned: 1});
const UserWordModel = mongoose.model('UserWord', userWordSchema);
UserWordModel.ensureIndexes();

module.exports = {
  'word': WordModel,
  'userword': UserWordModel
};
