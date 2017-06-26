var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var altSchema = new Schema({
  word: String,
  detailId: Schema.Types.ObjectId
}, {_id: false})

var wordLangSchema = new Schema({
  detailId: Schema.Types.ObjectId,
  word: {type: String, required: true},
  alt: [altSchema],
  hint: String,
  info: String
}, {_id: false})

var wordSchema = new Schema({
    docTpe: {type: String, required: true},
    wordTpe: {type: String, required: true},
    lanPair: [String],
    tags: [String],
    cs: wordLangSchema,
    de: wordLangSchema,
    fr: wordLangSchema,
    gb: wordLangSchema,
    nl: wordLangSchema,
    us: wordLangSchema
  }, {collection: 'wordpairs'}
);

module.exports = mongoose.model('Wordpair', wordSchema);