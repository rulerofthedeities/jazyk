'use strict';

const mongoose = require('mongoose'),
      mongooseUniqueValidator = require('mongoose-unique-validator'),
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
const UserWordModel = mongoose.model('userWord', userWordSchema);
UserWordModel.ensureIndexes();

var omegaDefinitionSchema = new Schema({
  dmid: {type: String, required: true},
  lanId: {type: String, required: true},
  definitionLanId: String,
  definitionTranslation: String,
  definitionText: String
}, {_id: false});

const definitionsSchema = new Schema({
  source: {type: String, required: true},
  word: {type: String, required: true},
  omegaWord: String,
  omegaDefinitions: [omegaDefinitionSchema]
});
const DefinitionsModel = mongoose.model('worddefinition', definitionsSchema);
definitionsSchema.index({source: 1, word: 1});
definitionsSchema.plugin(mongooseUniqueValidator);
DefinitionsModel.ensureIndexes();

var wordTranslationSchema = new Schema({
  translation: {type: String, required: true},
  definition: String,
  lanCode: String,
  source: String,
  userId: Schema.Types.ObjectId
});

const wordTranslationsSchema = new Schema({
  bookId: {type: Schema.Types.ObjectId, required: true},
  lanCode: {type: String, required: true},
  word: {type: String, required: true},
  translations: [wordTranslationSchema]
});
const TranslationsModel = mongoose.model('wordtranslation', wordTranslationsSchema);
wordTranslationsSchema.index({bookId: 1, lanCode: 1, word: 1});
TranslationsModel.ensureIndexes();

module.exports = {
  'word': WordModel,
  'userword': UserWordModel,
  'definitions': DefinitionsModel,
  'translations': TranslationsModel
};
