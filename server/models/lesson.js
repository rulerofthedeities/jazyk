var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var lanPairSchema = new Schema({
  from: String,
  to: String
}, {_id: false});

var wordSchema = new Schema({
  word: { type: String, required: true },
  annotations: String,
  hint: String,
  info: String,
  alt: String
}, {_id: false});

var exerciseSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  local: { type: wordSchema, required: true },
  foreign: { type: wordSchema, required: true },
  wordDetailId: String,
  wordTpe: String,
  followingCase: String,
  genus: String,
  article: String,
  aspect: String,
  image: String,
  audio: String,
  score: { type: Number, default: 0 }
})

var ExerciseTpeSchema = new Schema({
  active: Boolean,
  bidirectional: Boolean
}, {_id: false})

var ExerciseTpesSchema = new Schema({
  learn: ExerciseTpeSchema,
  practise: ExerciseTpeSchema,
  test: ExerciseTpeSchema,
  exam: ExerciseTpeSchema
}, {_id: false})

var lessonSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  courseId: Schema.Types.ObjectId,
  languagePair: { type: lanPairSchema, required: true },
  name: String,
  chapter: String,
  chapterNr: Number,
  exerciseTpes: ExerciseTpesSchema,
  exercises: [exerciseSchema],
  difficulty: Number,
  isPublished: Boolean,
  isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('Lesson', lessonSchema);
