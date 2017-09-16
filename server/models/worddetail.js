var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var detailSchema = new Schema({
    lan: {type: String, required: true},
    word: {type: String, required: true},
    docTpe: String,
    wordTpe: String,
    case: String,
    followingCase: String,
    genus: String,
    plural: String,
    diminutive: String,
    comparative: String,
    superlative: String,
    aspect: String,
    aspectPair: String,
    conjugation: [String],
    score: Number,
    wordCount: Number
  }, {collection: 'wordpairs'}
);

module.exports = mongoose.model('Detail', detailSchema);