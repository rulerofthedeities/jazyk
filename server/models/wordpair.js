var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var altWordSchema = new Schema({
  word: String,
  detailId: Schema.Types.ObjectId
}, {_id: false})

var wordLangSchema = new Schema({
  detailId: Schema.Types.ObjectId,
  word: {type: String, required: true},
  alt: {type: [altWordSchema], default: void 0},
  hint: String,
  info: String
}, {_id: false})

var wordSchema = new Schema({
    docTpe: {type: String, required: true},
    wordTpe: String,
    lanPair: [String],
    tags: [String],
    cs: wordLangSchema,
    de: wordLangSchema,
    en: wordLangSchema,
    es: wordLangSchema,
    fr: wordLangSchema,
    hu: wordLangSchema,
    it: wordLangSchema,
    lt: wordLangSchema,
    nl: wordLangSchema,
    pt: wordLangSchema,
    ru: wordLangSchema
  }, {collection: 'wordpairs'}
);

/*
wordSchema.index(
  {
    docTpe:1,
    lanPair:1,
    'cs.word': 'text',
    'cs.alt': 'text',
    'nl.word': 'text',
    'nl.alt': 'text'
  },{
    name: 'Wordpairindex',
    weights: {
      'cs.word': 10, 'cs.alt': 3,
      'nl.word': 10, 'nl.alt': 3
    }
  });
wordSchema.index({userId: 1, courseId: 1}); 
*/
module.exports = {
  model: mongoose.model('Wordpair', wordSchema),
  schema: wordSchema // for multiple dbs
};