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
  category: String,
  source: String,
  lanCode: String,
  img: String,
  author: String,
  difficulty: difficultySchema,
  isPublished: {type: Boolean, default: false}
});

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

var translationSchema = new Schema({
  translation: {type: String, required: true},
  lanCode: {type: String, required: true},
  userId: {type: String, required: true},
  created: {type: Date, default: new Date()},
  score: {type: Number, default: 0}
}, {_id: false});

var translationsSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  sentence: {type: String, required: true},
  translations: [translationSchema]
});

translationsSchema.index({bookId: 1, sentence: 1}, {unique: true});

module.exports = {
  book: mongoose.model('Book', bookSchema),
  chapter: mongoose.model('Bookchapter', chapterSchema),
  translation: mongoose.model('Booktranslation', translationsSchema)
}
