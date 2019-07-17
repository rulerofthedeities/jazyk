'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const sentenceSchema = new Schema({
  fileName: {type: String, required: true},
  text: String,
  isDisabled: Boolean,
  sequence: String, // For sorting
  isHeader: Boolean,
  isNewParagraph: Boolean,
  isEmptyLine: Boolean
}, {_id: false});

const audioChapterSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  lanCode: {type: String, required: true},
  directory: {type: String, required: true},
  fileName: {type: String, required: true},
  level: Number,
  sequence: Number,
  sentences: [sentenceSchema],
  nrOfWords: Number,
  nrOfUniqueWords: Number,
  wordLength: Number,
  totalScore: Number
});

audioChapterSchema.index({bookId: 1, sequence: 1}, {unique: true});
const ChapterModel = mongoose.model('Audiochapter', audioChapterSchema);

ChapterModel.ensureIndexes();

module.exports = {
  audiochapter: ChapterModel,
}
