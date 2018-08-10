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

module.exports = {
  book: mongoose.model('Book', bookSchema)
}
