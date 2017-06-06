var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/*
var exerciseTypeSchema = new Schema({
  nr: {type: Number, required: true},
  direction: {type: Number, required: true}
}, {_id: false})
*/

var lanPairSchema = new Schema({
  from: String,
  to: String
}, {_id: false});

var wordSchema = new Schema({
  word: {type: String, required: true}
}, {_id: false})

var exerciseSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  wordPairDetailId: Schema.Types.ObjectId,
  nr: { type:Number, required: true },
  tpes: [Number],
  wordTpe: String,
  cs: wordSchema,
  de: wordSchema,
  fr: wordSchema,
  gb: wordSchema,
  nl: wordSchema,
  us: wordSchema
})

var lessonSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  courseId: Schema.Types.ObjectId,
  languagePair: {type: lanPairSchema, required: true},
  name: String,
  chapter: String,
  nr: Number,
  exercises: [exerciseSchema],
  difficulty: Number,
  isPublished: Boolean,
  isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('Lesson', lessonSchema);
