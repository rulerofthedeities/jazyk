var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var exerciseTypeSchema = new Schema({
  nr: {type: Number, required: true},
  direction: {type: Number, required: true}
}, {_id: false})

var wordSchema = new Schema({
  word: {type: String, required: true}
}, {_id: false})

var exerciseSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, required: true},
  lessonId: Schema.Types.ObjectId,
  wordPairDetailId: Schema.Types.ObjectId,
  nr: {type:Number, required: true},
  languagePair: String,
  exerciseTypes: [exerciseTypeSchema],
  wordTpe: String,
  cs: wordSchema,
  de: wordSchema,
  fr: wordSchema,
  gb: wordSchema,
  nl: wordSchema,
  us: wordSchema
})

module.exports = mongoose.model('Exercise', exerciseSchema);
