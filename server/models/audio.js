'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const wordScoreSchema = new Schema({
  word: String,
  pos: Number,
  score: Number,
  unselectable: Boolean
}, {_id: false});

const audioSentenceSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  chapterId: {type: Schema.Types.ObjectId, required: true},
  fileName: {type: String, required: true},
  s3: String,
  words: [wordScoreSchema],
  text: {type: String, trim: true},
  isDisabled: Boolean,
  sequence: String, // For sorting
  isHeader: Boolean,
  isNewParagraph: Boolean,
  isEmptyLine: Boolean
});

audioSentenceSchema.index({bookId: 1, chapterId: 1, sequence: 1}, {unique: true});
const SentenceModel = mongoose.model('Audiosentence', audioSentenceSchema);

const audioChapterSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  lanCode: {type: String, required: true},
  directory: {type: String, required: true},
  fileName: {type: String, required: true},
  level: Number,
  sequence: Number,
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
  audiosentence: SentenceModel,
}
