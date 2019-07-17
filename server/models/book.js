'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var difficultySchema = new Schema({
  nrOfSentences: {type: Number, required: true},
  nrOfUniqueWords: {type: Number, required: true},
  nrOfWords: {type: Number, required: true},
  totalScore: {type: Number, required: true},
  avgLengthScore: {type: Number, required: true},
  avgWordScore: {type: Number, required: true},
  avgLength: {type: Number, required: true},
  weight: {type: Number, required: true}
});

var bookSchema = new Schema({
  title: {type: String, required: true},
  source: String,
  lanCode: String,
  img: String,
  author: String,
  difficulty: difficultySchema,
  isPublished: {type: Boolean, default: false}
});
bookSchema.index({'isPublished': 1, 'lanCode': 1, 'difficulty.weight': 1, 'difficulty.nrOfSentences': 1});
const BookModel = mongoose.model('Book', bookSchema),
      AudioBookModel = mongoose.model('Audiobook', bookSchema);

var sentenceSchema = new Schema({
  text: {type: String, required: true},
  isNewParagraph: Boolean
}, {_id: false});

var chapterSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  title: String,
  level: Number,
  sequence: Number,
  content: String,
  sentences: [sentenceSchema],
  nrOfWords: Number,
  nrOfUniqueWords: Number,
  totalScore: Number,
  lanCode: String
});

chapterSchema.index({bookId: 1, sequence: 1}, {unique: true});
const ChapterModel = mongoose.model('Bookchapter', chapterSchema);

var translationSchema = new Schema({
  translation: {type: String, required: true, trim: true},
  note: {type: String, trim: true},
  isMachine: Boolean,
  isDuplicate: Boolean,
  machine: String,
  lanCode: {type: String, required: true},
  userId: {type: Schema.Types.ObjectId, required: true},
  created: {type: Date, default: new Date()},
  score: {type: Number, default: 0} // Wilson score
});

var translationsSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  chapterSequence: {type: Number, required: true},
  lanCode: {type: String, required: true},
  sentence: {type: String, required: true},
  translations: [translationSchema]
});

translationsSchema.index({bookId: 1, chapterSequence: 1, sentence: 1}, {unique: true});
translationsSchema.index({'translations.lanCode': 1});
translationsSchema.index({'translations.isMachine': 1});
const TranslationModel = mongoose.model('Booktranslation', translationsSchema);

var dtSchema = new Schema({
  start: Date,
  end: Date,
  diff: Number
}, {_id: false});

var pointsSchema = new Schema({
  words: {type: Number, required: true, default: 0},
  translations: {type: Number, required: true, default: 0},
  test: {type: Number, required: true, default: 0},
  finished: {type: Number, required: true, default: 0}
}, {_id: false});

var sessionSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  userId: {type: Schema.Types.ObjectId, required: true},
  lanCode: {type: String, required: true},
  bookType: {type: String, required: true},
  isTest: {type: Boolean, required: true},
  answers: {type: String, required: true},
  nrYes: Number,
  nrNo: Number,
  nrMaybe: Number,
  translations: Number,
  repeatCount: Number,
  dt: dtSchema,
  points: pointsSchema,
  chapterId: String,
  chapterSequence: Number,
  sentenceNrChapter: Number,
  lastChapterId: String,
  lastChapterSequence: Number,
  lastSentenceNrChapter: Number,
  version: String
});

sessionSchema.index({userId: 1, bookId: 1, lanCode: 1});
const SessionModel = mongoose.model('UserSession', sessionSchema);

BookModel.ensureIndexes();
AudioBookModel.ensureIndexes();
ChapterModel.ensureIndexes();
TranslationModel.ensureIndexes();
SessionModel.ensureIndexes();

module.exports = {
  book: BookModel,
  audiobook: AudioBookModel,
  chapter: ChapterModel,
  translation: TranslationModel,
  session: SessionModel
}
